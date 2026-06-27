package app.lovable.glow_habit_widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Home-screen widget showing today's habits + progress. Reads the snapshot the
 * web app mirrors into SharedPreferences ("CapacitorStorage" / "widget_state"),
 * and on tap toggles a habit: it updates the snapshot for instant feedback and
 * queues an absolute-state op in "widget_pending" for the app to reconcile.
 */
public class HabitWidgetProvider extends AppWidgetProvider {
    public static final String PREFS = "CapacitorStorage";
    public static final String STATE_KEY = "widget_state";
    public static final String PENDING_KEY = "widget_pending";
    public static final String ACTION_TOGGLE = "app.lovable.glow_habit_widget.TOGGLE";
    public static final String EXTRA_HABIT_ID = "habitId";
    public static final String EXTRA_DONE = "done";

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager mgr, int[] ids) {
        for (int id : ids) updateWidget(context, mgr, id);
    }

    static void updateWidget(Context context, AppWidgetManager mgr, int widgetId) {
        RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_root);

        rv.setTextViewText(R.id.widget_title, headerTitle(context));
        rv.setTextViewText(R.id.widget_subtitle, headerSubtitle(context));

        // Header tap opens the app.
        Intent open = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (open != null) {
            PendingIntent openPi = PendingIntent.getActivity(
                context, 0, open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            rv.setOnClickPendingIntent(R.id.widget_header, openPi);
        }

        // Scrollable habit list backed by the RemoteViewsService.
        Intent svc = new Intent(context, HabitWidgetService.class);
        svc.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId);
        svc.setData(Uri.parse(svc.toUri(Intent.URI_INTENT_SCHEME)));
        rv.setRemoteAdapter(R.id.widget_list, svc);
        rv.setEmptyView(R.id.widget_list, R.id.widget_empty);

        // Per-row tap → TOGGLE broadcast (row fills in habitId/done).
        Intent toggle = new Intent(context, HabitWidgetProvider.class);
        toggle.setAction(ACTION_TOGGLE);
        PendingIntent togglePi = PendingIntent.getBroadcast(
            context, 0, toggle,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE);
        rv.setPendingIntentTemplate(R.id.widget_list, togglePi);

        mgr.updateAppWidget(widgetId, rv);
        mgr.notifyAppWidgetViewDataChanged(widgetId, R.id.widget_list);
        // The home-screen host caches the top-level (non-collection) views and
        // won't re-render them on a full updateAppWidget that re-binds the list
        // adapter. A partial update reliably refreshes the header text.
        refreshHeader(context, mgr, widgetId);
    }

    /** Forces just the header text to re-render (works alongside a collection). */
    static void refreshHeader(Context context, AppWidgetManager mgr, int widgetId) {
        RemoteViews head = new RemoteViews(context.getPackageName(), R.layout.widget_root);
        head.setTextViewText(R.id.widget_title, headerTitle(context));
        head.setTextViewText(R.id.widget_subtitle, headerSubtitle(context));
        mgr.partiallyUpdateAppWidget(widgetId, head);
    }

    /** Progress count derived from the habits array, kept in sync with the list. */
    private static String headerTitle(Context context) {
        String json = prefs(context).getString(STATE_KEY, null);
        if (json == null) return "Loop";
        try {
            JSONArray habits = new JSONObject(json).optJSONArray("habits");
            if (habits == null || habits.length() == 0) return "Loop";
            int done = 0;
            for (int i = 0; i < habits.length(); i++) {
                if (habits.getJSONObject(i).optBoolean("done")) done++;
            }
            return done + " / " + habits.length() + " today";
        } catch (Exception e) {
            return "Loop";
        }
    }

    private static String headerSubtitle(Context context) {
        String json = prefs(context).getString(STATE_KEY, null);
        if (json == null) return "Today's habits";
        try {
            String name = new JSONObject(json).optString("userName", "");
            return name.isEmpty() ? "Today's habits" : ("Hi " + name);
        } catch (Exception e) {
            return "Today's habits";
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_TOGGLE.equals(intent.getAction())) {
            String habitId = intent.getStringExtra(EXTRA_HABIT_ID);
            boolean currentlyDone = intent.getBooleanExtra(EXTRA_DONE, false);
            if (habitId != null) {
                applyToggle(context, habitId, !currentlyDone);
            }
            AppWidgetManager mgr = AppWidgetManager.getInstance(context);
            int[] ids = mgr.getAppWidgetIds(new ComponentName(context, HabitWidgetProvider.class));
            for (int id : ids) updateWidget(context, mgr, id);
        }
    }

    private static void applyToggle(Context context, String habitId, boolean newDone) {
        SharedPreferences p = prefs(context);
        try {
            String json = p.getString(STATE_KEY, null);
            if (json == null) return;
            JSONObject o = new JSONObject(json);
            String date = o.optString("date", "");
            JSONArray habits = o.optJSONArray("habits");
            int done = 0, total = 0;
            if (habits != null) {
                total = habits.length();
                for (int i = 0; i < habits.length(); i++) {
                    JSONObject h = habits.getJSONObject(i);
                    if (habitId.equals(h.optString("id"))) {
                        h.put("done", newDone);
                    }
                    if (h.optBoolean("done")) done++;
                }
            }
            o.put("doneCount", done);
            o.put("total", total);
            p.edit().putString(STATE_KEY, o.toString()).apply();

            // Queue an absolute-state op (idempotent on the app side).
            JSONArray pending;
            try {
                pending = new JSONArray(p.getString(PENDING_KEY, "[]"));
            } catch (Exception e) {
                pending = new JSONArray();
            }
            JSONObject op = new JSONObject();
            op.put("habitId", habitId);
            op.put("date", date);
            op.put("done", newDone);
            pending.put(op);
            p.edit().putString(PENDING_KEY, pending.toString()).apply();
        } catch (Exception ignored) {
        }
    }
}
