package app.lovable.glow_habit_widget;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(HabitWidgetPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
