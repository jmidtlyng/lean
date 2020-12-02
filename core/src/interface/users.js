module.exports = (db) => {
  return {
    async findByLocalCreds(username, pw) {
      try {
        var q = "SELECT a.id AS id \
                  FROM account AS a \
                    LEFT JOIN account_email AS ae ON ae.account = a.id \
                  WHERE TRIM(ae.email) LIKE $1 \
                    AND a.password = crypt($2, a.password)";
        var user = await db.one(q,[username, pw]);
        return user;
      } catch(e){ throw e; }
    },
    async findByEmail(email) {
      try {
        var q = "SELECT a.id AS id, a.firstname AS fname, a.lastname AS lname, a.isadmin AS isamdin \
                  FROM account_email AS ae \
                    LEFT JOIN account AS a ON a.id = ae.account \
                  WHERE ae.email LIKE $1";
        var user = await db.one(q,[email]);
        return user;
      } catch(e){ return null; }
    },
    async findById(id) {
      try {
        var q = "SELECT id, firstname AS fname, lastname AS lname, isadmin \
                  FROM account \
                  WHERE id = $1"
        var user = await db.one(q,[id]);
        return user;
      } catch(e){ return null; }
    },
    async permission(id){
      try {
        var userGroupsQ = "SELECT DISTINCT acs.access, acs.create, acs.archive, acs.account_group, \
                                etg.id AS actor_type, etg.name AS actor_type_name, etg.handle AS actor_type_handle,\
                                eta.id AS subject_type, eta.name AS subject_type_name, \
                              	eta.handle AS subject_type_handle, ag.name AS group_name, ag.handle AS group_handle \
                              FROM account_group AS ag \
                              	LEFT JOIN (SELECT * FROM entity_account WHERE isarchived = false) \
                              	  AS ea ON ea.account_group = ag.id \
                            	LEFT JOIN account AS a ON a.id = ea.account \
                            	LEFT JOIN (SELECT * FROM entity_type WHERE isarchived = false) \
                            	  AS etg ON etg.id = ag.entity_type \
                            	LEFT JOIN (SELECT * FROM entity_type_account_group_access WHERE isarchived = false) \
                            	  AS acs ON acs.account_group = ag.id \
                            	LEFT JOIN (SELECT * FROM entity_type WHERE isarchived = false) \
                            	  AS eta ON eta.id = acs.entity_type \
                              WHERE a.id = $1 AND ag.isarchived = false";
        var fieldAccessQ = "SELECT DISTINCT f.id AS id, acs.read, acs.write, ef.name AS name, f.data_type AS data_type, \
                              f.settings AS settings, f.handle AS handle, ef.list_position \
                            FROM entity_type_field AS ef \
                              LEFT JOIN entity_type_field_account_group_access AS acs ON ef.id = acs.entity_type_field \
                              LEFT JOIN (SELECT * FROM field WHERE isarchived = false) AS f ON f.id = ef.field \
                            WHERE ef.entity_type = $1 AND acs.account_group = $2 AND ef.isarchived = false \
                              AND acs.isarchived = false AND (acs.read = TRUE OR acs.write = TRUE) \
                              ORDER BY ef.list_position";
        var activityAccessQ = "SELECT DISTINCT acs.read, acs.write, acs.activity, act.name AS name, act.handle AS handle \
                                FROM entity_type_activity_account_group_access AS acs \
                                  LEFT JOIN (SELECT * FROM activity WHERE isarchived = false) AS act ON act.id = acs.activity \
                                WHERE acs.entity_type = $1 AND acs.account_group = $2 AND acs.isarchived = false \
                                  AND (acs.read = TRUE OR acs.write = TRUE)";
        var selfFieldAccessQ = "SELECT DISTINCT f.id AS id, acs.read, acs.write, ef.name AS name, \
                                  f.data_type AS data_type, f.handle AS handle \
                                FROM self_field_account_group_access AS acs \
                                  LEFT JOIN (SELECT * FROM entity_type_field WHERE isarchived = false) AS ef ON ef.id = acs.entity_type_field \
                                  LEFT JOIN (SELECT * FROM field WHERE isarchived = false) AS f ON f.id = ef.field \
                                WHERE acs.account_group = $1 AND acs.isarchived = false \
                                  AND (acs.read = TRUE OR acs.write = TRUE)";
        var selfActivityAccessQ = "SELECT DISTINCT acs.read, acs.write, acs.activity, act.name AS name, act.handle AS handle \
                                    FROM self_activity_account_group_access AS acs \
                                      LEFT JOIN (SELECT * FROM activity WHERE isarchived = false) AS act ON act.id = acs.activity \
                                    WHERE acs.account_group = $1 AND acs.isarchived = false \
                                      AND (acs.read = TRUE OR acs.write = TRUE)";

        var userGroups = await db.any(userGroupsQ, [id]);

        var accessObj = {};

        for (const userGroupIter in userGroups) {
          var userGroup = userGroups[userGroupIter];

          if(userGroup.access || userGroup.create || userGroup.archive){
            var fields = await db.any(fieldAccessQ, [userGroup.subject_type, userGroup.account_group])/*,
                activities = await db.any(activityAccessQ, [userGroup.subject_type, userGroup.account_group])*/;

            if(accessObj[userGroup.subject_type_handle]){
              if(userGroup.access != accessObj[userGroup.subject_type_handle].access){
                accessObj[userGroup.subject_type_handle].access = true;
              }
              if(userGroup.create != accessObj[userGroup.subject_type_handle].create){
                accessObj[userGroup.subject_type_handle].create = true;
              }
              if(userGroup.archive != accessObj[userGroup.subject_type_handle].archive){
                accessObj[userGroup.subject_type_handle].archive = true;
              }

              for(var fieldIter in fields){
                var field = fields[fieldIter];
                if(accessObj[userGroup.subject_type_handle].fields[field.handle]){
                  if(field.read != accessObj[userGroup.subject_type_handle].fields[field.handle].read){
                    accessObj[userGroup.subject_type_handle].fields[field.handle].read = true;
                  }
                  if(field.write != accessObj[userGroup.subject_type_handle].fields[field.handle].write){
                    accessObj[userGroup.subject_type_handle].fields[field.handle].write = true;
                  }
                } else {
                  accessObj[userGroup.subject_type_handle].fields[field.handle] = field;
                }
              }/*
              for(var activityIter in activities){
                var activity = activities[activityIter];
                if(accessObj[userGroup.subject_type_handle].activities[activity.handle]){
                  if(activity.read != accessObj[userGroup.subject_type_handle].activities[activity.handle].read){
                    accessObj[userGroup.subject_type_handle].activities[activity.handle].read = true;
                  }
                  if(activity.write != accessObj[userGroup.subject_type_handle].activities[activity.handle].write){
                    accessObj[userGroup.subject_type_handle].activities[activity.handle].write = true;
                  }
                } else {
                  accessObj[userGroup.subject_type_handle].activities[activity.handle] = { read: activity.read, write: activity.write }
                }
              }*/
            } else {
              var entityFieldAccess = {}/*,
                  entityActivityAccess = {}*/;

              for(var fieldIter in fields){
                var field = fields[fieldIter];
                entityFieldAccess[field.handle] = field;
              }/*
              for(var activityIter in activities){
                var activity = activities[activityIter];
                entityActivityAccess[activity.handle] = { read: activity.read, write: activity.write }
              }*/
              accessObj[userGroup.subject_type_handle] = {
                name: userGroup.subject_type_name,
                access: userGroup.access,
                create: userGroup.create,
                archive: userGroup.archive,
                fields: entityFieldAccess,
                //activities: entityActivityAccess,
                userGroups: {}
              }
            }
          }

          var selfFields = await db.any(selfFieldAccessQ, [userGroup.account_group]),
              //selfActivities = await db.any(selfActivityAccessQ, [userGroup.account_group]),
              selfFieldAccess = {}/*,
              selfActivityAccess = {}*/;

          for(var fieldIter in selfFields){
            var field = selfFields[fieldIter];
            selfFieldAccess[field.handle] = field;
          }/*
          for(var activityIter in selfActivities){
            var activity = selfActivities[activityIter];
            selfActivityAccess[activity.handle] = { read: activity.read, write: activity.write }
          }*/

          if(!accessObj[userGroup.actor_type_handle]){
            accessObj[userGroup.actor_type_handle] = {
              name: userGroup.actor_type_name,
              access: false,
              create: false,
              archive: false,
              fields: {},
              activities: {},
              userGroups: {}
            }
          }

          accessObj[userGroup.actor_type_handle].userGroups[userGroup.group_handle] = {
            fields: selfFieldAccess,
            //activities: selfActivityAccess
          }
        }

        return accessObj;
      } catch(e) { throw(e); }
    }
  }
}
