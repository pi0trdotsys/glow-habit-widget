package app.lovable.glow_habit_widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Aesthetic icon widget: a progress ring, time left in the day, and a fixed grid
 * of habit icon chips (tap to toggle). Uses direct per-cell PendingIntents (no
 * collection) so taps deliver reliably. Shows up to {@link #MAX_CELLS} habits.
 */
public class HabitWidget2Provider extends AppWidgetProvider {
    private static final int MAX_CELLS = 8;
    private static final int ICON_ON_FILL = 0xFF0F1116;
    private static final int NAME_DONE = Color.parseColor("#f4f5f9");
    private static final int NAME_IDLE = Color.parseColor("#9398a5");

    private static final int[] ROOT = {
        R.id.cell0_root, R.id.cell1_root, R.id.cell2_root, R.id.cell3_root,
        R.id.cell4_root, R.id.cell5_root, R.id.cell6_root, R.id.cell7_root,
    };
    private static final int[] BG = {
        R.id.cell0_bg, R.id.cell1_bg, R.id.cell2_bg, R.id.cell3_bg,
        R.id.cell4_bg, R.id.cell5_bg, R.id.cell6_bg, R.id.cell7_bg,
    };
    private static final int[] ICON = {
        R.id.cell0_icon, R.id.cell1_icon, R.id.cell2_icon, R.id.cell3_icon,
        R.id.cell4_icon, R.id.cell5_icon, R.id.cell6_icon, R.id.cell7_icon,
    };
    private static final int[] NAME = {
        R.id.cell0_name, R.id.cell1_name, R.id.cell2_name, R.id.cell3_name,
        R.id.cell4_name, R.id.cell5_name, R.id.cell6_name, R.id.cell7_name,
    };

    @Override
    public void onUpdate(Context context, AppWidgetManager mgr, int[] ids) {
        for (int id : ids) updateWidget(context, mgr, id);
    }

    static void updateWidget(Context context, AppWidgetManager mgr, int widgetId) {
        WidgetShared.normalizeIfStale(context);
        RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget2_root);

        JSONArray habits = WidgetShared.habits(context);
        int total = habits.length();
        int done = WidgetShared.doneCount(context);
        int n = Math.min(total, MAX_CELLS);

        rv.setImageViewBitmap(R.id.widget2_ring, WidgetShared.progressRing(context, done, total));
        rv.setTextViewText(R.id.widget2_title, total > 0 ? "Today" : "Loop");
        rv.setTextViewText(R.id.widget2_timeleft, total > 0 ? WidgetShared.timeLeft() : "");

        PendingIntent openPi = openAppIntent(context);
        if (openPi != null) rv.setOnClickPendingIntent(R.id.widget2_header, openPi);

        for (int i = 0; i < MAX_CELLS; i++) {
            if (i < n) {
                JSONObject h = habits.optJSONObject(i);
                bindCell(context, rv, i, h, widgetId);
                rv.setViewVisibility(ROOT[i], View.VISIBLE);
            } else {
                rv.setViewVisibility(ROOT[i], View.INVISIBLE);
            }
        }
        rv.setViewVisibility(R.id.widget2_row1, n > 0 ? View.VISIBLE : View.GONE);
        rv.setViewVisibility(R.id.widget2_row2, n > 4 ? View.VISIBLE : View.GONE);
        rv.setViewVisibility(R.id.widget2_empty, n == 0 ? View.VISIBLE : View.GONE);

        mgr.updateAppWidget(widgetId, rv);
    }

    private static void bindCell(Context context, RemoteViews rv, int i, JSONObject h, int widgetId) {
        String id = h.optString("id");
        String name = h.optString("name", "");
        boolean done = h.optBoolean("done", false);
        int color;
        try {
            color = Color.parseColor(h.optString("colorHex", "#59e0ad"));
        } catch (Exception e) {
            color = Color.parseColor("#59e0ad");
        }

        rv.setImageViewResource(ICON[i], WidgetShared.iconRes(context, h.optString("icon", "")));
        if (done) {
            rv.setInt(BG[i], "setColorFilter", 0xFF000000 | (color & 0xFFFFFF));
            rv.setInt(ICON[i], "setColorFilter", ICON_ON_FILL);
        } else {
            rv.setInt(BG[i], "setColorFilter", 0x40000000 | (color & 0xFFFFFF));
            rv.setInt(ICON[i], "setColorFilter", color);
        }
        rv.setTextViewText(NAME[i], name);
        rv.setInt(NAME[i], "setTextColor", done ? NAME_DONE : NAME_IDLE);

        Intent t = new Intent(context, HabitWidget2Provider.class);
        t.setAction(WidgetShared.ACTION_TOGGLE);
        t.putExtra(WidgetShared.EXTRA_HABIT_ID, id);
        t.putExtra(WidgetShared.EXTRA_DONE, done);
        // Unique data so each cell gets a distinct PendingIntent.
        t.setData(Uri.parse("loop://w2/" + widgetId + "/" + id));
        PendingIntent pi = PendingIntent.getBroadcast(
            context, 100 + i, t,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        rv.setOnClickPendingIntent(ROOT[i], pi);
    }

    private static PendingIntent openAppIntent(Context context) {
        Intent open = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (open == null) return null;
        return PendingIntent.getActivity(
            context, 1, open,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();
        if (WidgetShared.ACTION_TOGGLE.equals(action)) {
            String habitId = intent.getStringExtra(WidgetShared.EXTRA_HABIT_ID);
            boolean currentlyDone = intent.getBooleanExtra(WidgetShared.EXTRA_DONE, false);
            if (habitId != null) {
                WidgetShared.applyToggle(context, habitId, !currentlyDone);
            }
            WidgetShared.updateAll(context);
        } else if (Intent.ACTION_DATE_CHANGED.equals(action)
                || Intent.ACTION_TIME_CHANGED.equals(action)
                || Intent.ACTION_TIMEZONE_CHANGED.equals(action)) {
            // New day (or clock change): reset the snapshot and re-render.
            WidgetShared.normalizeIfStale(context);
            WidgetShared.updateAll(context);
        }
    }
}
