package app.lovable.glow_habit_widget;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;

/**
 * Shared state + helpers for both home-screen widgets. The web app mirrors a
 * snapshot into SharedPreferences ("CapacitorStorage" / "widget_state"); both
 * widgets read it. Toggles update the snapshot and queue an op the app
 * reconciles on next open.
 */
final class WidgetShared {
    static final String PREFS = "CapacitorStorage";
    static final String STATE_KEY = "widget_state";
    static final String PENDING_KEY = "widget_pending";
    static final String ACTION_TOGGLE = "app.lovable.glow_habit_widget.TOGGLE";
    static final String EXTRA_HABIT_ID = "habitId";
    static final String EXTRA_DONE = "done";

    static final int ACCENT = 0xFF60E7B4;
    static final int TRACK = 0xFF2A2E3A;
    static final int TEXT = 0xFFF4F5F9;

    private WidgetShared() {}

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static JSONArray habits(Context c) {
        String json = prefs(c).getString(STATE_KEY, null);
        if (json == null) return new JSONArray();
        try {
            JSONArray a = new JSONObject(json).optJSONArray("habits");
            return a != null ? a : new JSONArray();
        } catch (Exception e) {
            return new JSONArray();
        }
    }

    static int doneCount(Context c) {
        JSONArray h = habits(c);
        int d = 0;
        for (int i = 0; i < h.length(); i++) {
            if (h.optJSONObject(i).optBoolean("done")) d++;
        }
        return d;
    }

    static String userName(Context c) {
        String json = prefs(c).getString(STATE_KEY, null);
        if (json == null) return "";
        try {
            return new JSONObject(json).optString("userName", "");
        } catch (Exception e) {
            return "";
        }
    }

    /** "5h 23m left" until end of day; computed natively so it's always current. */
    static String timeLeft() {
        Calendar now = Calendar.getInstance();
        Calendar eod = (Calendar) now.clone();
        eod.set(Calendar.HOUR_OF_DAY, 23);
        eod.set(Calendar.MINUTE, 59);
        eod.set(Calendar.SECOND, 59);
        long ms = eod.getTimeInMillis() - now.getTimeInMillis();
        if (ms < 0) ms = 0;
        long h = ms / 3600000L;
        long m = (ms % 3600000L) / 60000L;
        if (h > 0) return h + "h " + m + "m left";
        return m + "m left";
    }

    /** Applies a toggle to the snapshot and queues an idempotent op for the app. */
    static void applyToggle(Context context, String habitId, boolean newDone) {
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
                    if (habitId.equals(h.optString("id"))) h.put("done", newDone);
                    if (h.optBoolean("done")) done++;
                }
            }
            o.put("doneCount", done);
            o.put("total", total);
            p.edit().putString(STATE_KEY, o.toString()).apply();

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

    /** Resolves a lucide icon name (e.g. "BookOpen") to ic_habit_book_open. */
    static int iconRes(Context c, String iconName) {
        String snake = pascalToSnake(iconName);
        int id = c.getResources().getIdentifier("ic_habit_" + snake, "drawable", c.getPackageName());
        if (id == 0) {
            id = c.getResources().getIdentifier("ic_habit_default", "drawable", c.getPackageName());
        }
        return id;
    }

    private static String pascalToSnake(String s) {
        if (s == null || s.isEmpty()) return "default";
        StringBuilder b = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            if (Character.isUpperCase(ch)) {
                if (i > 0) b.append('_');
                b.append(Character.toLowerCase(ch));
            } else {
                b.append(ch);
            }
        }
        return b.toString();
    }

    static int dp(Context c, float v) {
        return Math.round(v * c.getResources().getDisplayMetrics().density);
    }

    /** Draws a circular progress ring with the "done/total" count in the centre. */
    static Bitmap progressRing(Context c, int done, int total) {
        int size = dp(c, 60);
        float stroke = dp(c, 6);
        Bitmap bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bmp);
        float pad = stroke / 2f + dp(c, 1);
        RectF r = new RectF(pad, pad, size - pad, size - pad);

        Paint track = new Paint(Paint.ANTI_ALIAS_FLAG);
        track.setStyle(Paint.Style.STROKE);
        track.setStrokeWidth(stroke);
        track.setColor(TRACK);
        canvas.drawArc(r, 0, 360, false, track);

        Paint prog = new Paint(Paint.ANTI_ALIAS_FLAG);
        prog.setStyle(Paint.Style.STROKE);
        prog.setStrokeWidth(stroke);
        prog.setStrokeCap(Paint.Cap.ROUND);
        prog.setColor(ACCENT);
        float sweep = total > 0 ? 360f * done / total : 0;
        if (sweep > 0) canvas.drawArc(r, -90, sweep, false, prog);

        Paint txt = new Paint(Paint.ANTI_ALIAS_FLAG);
        txt.setColor(TEXT);
        txt.setTextAlign(Paint.Align.CENTER);
        txt.setFakeBoldText(true);
        txt.setTextSize(dp(c, 15));
        float ty = size / 2f - (txt.descent() + txt.ascent()) / 2f;
        canvas.drawText(done + "/" + total, size / 2f, ty, txt);

        return bmp;
    }

    /** Refreshes every instance of both widgets. */
    static void updateAll(Context context) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(context);
        for (int id : mgr.getAppWidgetIds(new ComponentName(context, HabitWidgetProvider.class))) {
            HabitWidgetProvider.updateWidget(context, mgr, id);
        }
        for (int id : mgr.getAppWidgetIds(new ComponentName(context, HabitWidget2Provider.class))) {
            HabitWidget2Provider.updateWidget(context, mgr, id);
        }
    }
}
