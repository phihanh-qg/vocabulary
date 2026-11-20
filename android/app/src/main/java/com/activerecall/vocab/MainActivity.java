package com.activerecall.vocab;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(VocabWidgetPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
