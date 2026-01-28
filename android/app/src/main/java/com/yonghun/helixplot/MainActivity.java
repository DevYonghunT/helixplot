package com.yonghun.helixplot;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Enable edge-to-edge display for Android 15+ (SDK 35+) compatibility
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
    }
}
