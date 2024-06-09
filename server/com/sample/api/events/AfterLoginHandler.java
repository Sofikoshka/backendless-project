package com.sample.api.events;

import com.backendless.Backendless;
import com.backendless.BackendlessUser;
import com.backendless.async.callback.AsyncCallback;
import com.backendless.exceptions.BackendlessFault;
import com.backendless.servercode.ExecutionResult;
import com.backendless.servercode.RunnerContext;
import com.backendless.servercode.extension.UserExtender;

import java.util.HashMap;
import java.util.Map;

public class AfterLoginHandler extends UserExtender {

    public static final String ONLINE = "onlineCount";
    public static final String STATISTICS = "Statistics";

    @Override
    public void afterLogin(RunnerContext context, String login, String password, ExecutionResult<BackendlessUser> result) throws Exception {
        Backendless.Data.of(STATISTICS).findFirst(new AsyncCallback<Map>() {
            @Override
            public void handleResponse(Map response) {
                if (response != null && response.get(ONLINE) instanceof Integer) {
                    Integer usersOnline = (Integer) response.get(ONLINE);
                    usersOnline++;
                    Map<String, Object> updatedStats = new HashMap<>();
                    updatedStats.put("objectId", response.get("objectId"));
                    updatedStats.put(ONLINE, usersOnline);
                    Backendless.Data.of(STATISTICS).save(updatedStats, new AsyncCallback<Map>() {
                        @Override
                        public void handleResponse(Map saveResponse) {
          
                        }

                        @Override
                        public void handleFault(BackendlessFault saveFault) {
                            // Handle error in saving updated statistics
                            System.err.println("Error saving updated statistics: " + saveFault.getMessage());
                        }
                    });
                } else {
    
                    initializeOnlineCount();
                }
            }

            @Override
            public void handleFault(BackendlessFault fault) {
                initializeOnlineCount();
            }
        });
    }

    private void initializeOnlineCount() {
        Map<String, Object> initialStats = new HashMap<>();
        initialStats.put(ONLINE, 1);
        Backendless.Data.of(STATISTICS).save(initialStats, new AsyncCallback<Map>() {
            @Override
            public void handleResponse(Map saveResponse) {
              
            }

            @Override
            public void handleFault(BackendlessFault saveFault) {
            
                System.err.println("Error initializing statistics: " + saveFault.getMessage());
            }
        });
    }
}
