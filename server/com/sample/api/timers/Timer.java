package com.sample.api.timers;

import com.backendless.Backendless;
import com.backendless.persistence.DataQueryBuilder;
import com.backendless.servercode.annotation.BackendlessTimer;
import com.backendless.servercode.extension.TimerExtender;

import java.util.List;
import java.util.Map;

@BackendlessTimer("{'startDate':1717736400000,'language':'JAVA','mode':'DRAFT','model':'default','file':'com/sample/api/timers/Timer.java','frequency':{'schedule':'daily','repeat':{'every':1}},'timername':'Timer'}")
public class Timer extends TimerExtender {
    private static final String EMAIL_SUBJECT = "Happy Registration Anniversary!";
    private static final String EMAIL_BODY = "Congratulations on reaching another milestone with us! We're delighted to celebrate your registration anniversary with you. Here's to many more years of success and happiness together!";

    @Override
    public void execute() {
        String whereClause = "DAYOFMONTH(created) = DAYOFMONTH(NOW()) AND MONTH(created) = MONTH(NOW())";
        DataQueryBuilder queryBuilder = DataQueryBuilder.create();
        queryBuilder.setWhereClause(whereClause);

        List<Map> users = Backendless.Data.of("Users").find(queryBuilder);

        if (users != null) {
            for (Map user : users) {
                String email = (String) user.get("email");
                if (email != null && !email.isEmpty()) {
                    Backendless.Messaging.sendTextEmail(EMAIL_SUBJECT, EMAIL_BODY, email);
                }
            }
        }
    }
}
