package app.lovable.glow_habit_widget;

import android.content.Intent;
import android.widget.RemoteViewsService;

public class HabitWidgetService extends RemoteViewsService {
    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new HabitRemoteViewsFactory(getApplicationContext());
    }
}
