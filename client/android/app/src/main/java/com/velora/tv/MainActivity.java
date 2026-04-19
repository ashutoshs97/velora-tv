package com.velora.tv;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onStart() {
        super.onStart();
        
        WebView webView = this.bridge.getWebView();
        if (webView != null) {
            // Hide native scrollbars at the OS level so we don't need to pollute the web CSS
            webView.setHorizontalScrollBarEnabled(false);
            webView.setVerticalScrollBarEnabled(false);
            webView.setScrollBarStyle(WebView.SCROLLBARS_OUTSIDE_OVERLAY);
            webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        }
    }
}
