package app.lovable.glow_habit_widget;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.view.View;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/** Builds one row per habit from the "widget_state" snapshot. */
public class HabitRemoteViewsFactory implements RemoteViewsService.RemoteViewsFactory {
    private static final int NAME_ACTIVE = Color.parseColor("#f4f5f9");
    private static final int NAME_DONE = Color.parseColor("#9398a5");

    private final Context context;
    private final List<JSONObject> items = new ArrayList<>();

    HabitRemoteViewsFactory(Context context) {
        this.context = context;
    }

    @Override
    public void onCreate() {
    }

    @Override
    public void onDestroy() {
        items.clear();
    }

    @Override
    public int getCount() {
        return items.size();
    }

    @Override
    public long getItemId(int position) {
        return position;
    }

    @Override
    public boolean hasStableIds() {
        return false;
    }

    @Override
    public RemoteViews getLoadingView() {
        return null;
    }

    @Override
    public int getViewTypeCount() {
        return 1;
    }

    @Override
    public void onDataSetChanged() {
        items.clear();
        SharedPreferences p = context.getSharedPreferences(
            HabitWidgetProvider.PREFS, Context.MODE_PRIVATE);
        String json = p.getString(HabitWidgetProvider.STATE_KEY, null);
        if (json == null) return;
        try {
            JSONArray habits = new JSONObject(json).optJSONArray("habits");
            if (habits != null) {
                for (int i = 0; i < habits.length(); i++) {
                    items.add(habits.getJSONObject(i));
                }
            }
        } catch (Exception ignored) {
        }
    }

    @Override
    public RemoteViews getViewAt(int position) {
        JSONObject h = items.get(position);
        RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_row);

        String name = h.optString("name", "");
        boolean done = h.optBoolean("done", false);
        int color;
        try {
            color = Color.parseColor(h.optString("colorHex", "#59e0ad"));
        } catch (Exception e) {
            color = Color.parseColor("#59e0ad");
        }

        rv.setTextViewText(R.id.row_name, name);
        rv.setInt(R.id.row_dot, "setTextColor", color);
        rv.setInt(R.id.row_name, "setTextColor", done ? NAME_DONE : NAME_ACTIVE);
        rv.setTextViewText(R.id.row_check, done ? "✓" : "");
        rv.setInt(R.id.row_check, "setTextColor", color);

        Intent fill = new Intent();
        fill.putExtra(HabitWidgetProvider.EXTRA_HABIT_ID, h.optString("id"));
        fill.putExtra(HabitWidgetProvider.EXTRA_DONE, done);
        rv.setOnClickFillInIntent(R.id.row_root, fill);
        return rv;
    }
}
