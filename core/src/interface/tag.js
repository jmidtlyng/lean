module.exports = (db, sse) => {
  return {
    async getEntityTags(userId, fieldId, entityId){
      try {
        var q = "SELECT DISTINCT t.*, tg.name AS tag_group_name, tg.handle AS tag_group_handle \
                  FROM tag AS t \
                    LEFT JOIN (SELECT * FROM tag_matrix WHERE isarchived = false) \
                      AS tm ON tm.tag = t.id \
                    LEFT JOIN (SELECT * FROM tag_group_tag WHERE isarchived = false) \
                      AS tgt ON tgt.tag = t.id \
                    LEFT JOIN (SELECT * FROM tag_group WHERE isarchived = false) \
                      AS tg ON tg.id = tgt.tag_group \
                  WHERE t.isarchived = false AND tm.entity = $1 and tm.field = $2 \
                    AND (t.ispublic OR t.account = $3)";

        var res = await db.any(q, [entityId, fieldId, userId]);
        return res;
      } catch (e) { console.log(e); }
    },
    async tagSearch(userId, field, search=false){
      try {
        var q = "",
            res = [];

        if(search) {
          q = "SELECT t.*, tg.name AS tag_group_name, tg.handle AS tag_group_handle \
                FROM tag AS t \
                  LEFT JOIN (SELECT * FROM tag_group_tag WHERE isarchived = false) \
                    AS tgt ON tgt.tag = t.id \
                  LEFT JOIN (SELECT * FROM tag_group WHERE isarchived = false) \
                    AS tg ON tg.id = tgt.tag_group \
                WHERE t.isarchived = false \
                  AND (t.account = $1 OR \
                    (t.ispublic = true AND tgt.tag_group IN (SELECT e::text::int AS source FROM field, \
                      jsonb_array_elements(settings->'source') e WHERE id = $2)))  \
                  AND t.handle LIKE $3";
          search = '%'+search+'%';
          res = await db.any(q, [userId, field, search]);
        } else {
          q = "SELECT t.*, tg.name AS tag_group_name, tg.handle AS tag_group_handle \
                FROM tag AS t \
                  LEFT JOIN (SELECT * FROM tag_group_tag WHERE isarchived = false) \
                    AS tgt ON tgt.tag = t.id \
                  LEFT JOIN (SELECT * FROM tag_group WHERE isarchived = false) \
                    AS tg ON tg.id = tgt.tag_group \
                WHERE t.isarchived = false \
                  AND (t.account = $1 OR \
                    (t.ispublic = true AND tgt.tag_group IN (SELECT e::text::int AS source FROM field, \
                      jsonb_array_elements(settings->'source') e WHERE id = $2)))";

          res = await db.any(q, [userId, field]);
        }

        return res;
      } catch (e) { console.log(e); }
    },
    async searchOuterTags(entityId, userId, field, search=false){
      try {
        var q = "",
            res = [];

        if(search) {
          q = "SELECT t.*, tg.name AS tag_group_name, tg.handle AS tag_group_handle \
                FROM tag AS t \
                  LEFT JOIN (SELECT * FROM tag_matrix WHERE isarchived = false \
                    AND entity = $1) \
                    AS tm ON tm.tag = t.id \
                  LEFT JOIN (SELECT * FROM tag_group_tag WHERE isarchived = false) \
                    AS tgt ON tgt.tag = t.id \
                  LEFT JOIN (SELECT * FROM tag_group WHERE isarchived = false) \
                    AS tg ON tg.id = tgt.tag_group \
                WHERE t.isarchived = false AND tm.id IS NULL\
                  AND (t.account = $2 OR \
                    (t.ispublic = true AND tgt.tag_group IN (SELECT e::text::int AS source FROM field, \
                      jsonb_array_elements(settings->'source') e WHERE id = $3)))  \
                  AND t.handle LIKE $4";
          search = '%'+search+'%';
          res = await db.any(q, [entityId, userId, field, search]);
        } else {
          q = "SELECT t.*, tg.name AS tag_group_name, tg.handle AS tag_group_handle \
                FROM tag AS t \
                  LEFT JOIN (SELECT * FROM tag_matrix WHERE isarchived = false \
                    AND entity = $1) \
                    AS tm ON tm.tag = t.id \
                  LEFT JOIN (SELECT * FROM tag_group_tag WHERE isarchived = false) \
                    AS tgt ON tgt.tag = t.id \
                  LEFT JOIN (SELECT * FROM tag_group WHERE isarchived = false) \
                    AS tg ON tg.id = tgt.tag_group \
                WHERE t.isarchived = false AND tm.id IS NULL\
                  AND (t.account = $2 OR \
                    (t.ispublic = true AND tgt.tag_group IN (SELECT e::text::int AS source FROM field, \
                      jsonb_array_elements(settings->'source') e WHERE id = $3)))";

          res = await db.any(q, [entityId, userId, field]);
        }

        return res;
      } catch (e) { console.log(e); }
    },
    async getGroupTags(groupHandles, userId, search=false){
      try {
        var q = "",
            res = [];

        if(search) {
          q = "SELECT t.* FROM tag AS t \
                  LEFT JOIN tag_group_tag AS tgt ON tgt.tag = t.id \
                  LEFT JOIN tag_group AS tg ON tg.id = tgt.tag_group \
                WHERE (t.ispublic = true OR t.account = $1) AND t.isarchived = false \
                  AND tg.handle IN ($2:csv) AND t.handle LIKE $3";
          res = await db.any(q, [userId, groupHandles, search]);
        } else {
          q = "SELECT t.* FROM tag AS t \
                  LEFT JOIN tag_group_tag AS tgt ON tgt.tag = t.id \
                  LEFT JOIN tag_group AS tg ON tg.id = tgt.tag_group \
                WHERE (t.ispublic = true OR t.account = $1) AND t.isarchived = false \
                  AND tg.handle IN ($2:csv)";
          res = await db.any(q, [userId, groupHandles]);
        }

        return res;
      } catch (e) { console.log(e); }
    },
    async getAllTagsAdmin(){
      try {
        /*
          var q = "SELECT t.*, u.firstname AS user_fname, u.lastname AS user_lname, \
                      u.isarchived AS user_isarchived FROM tag AS t \
                      LEFT JOIN user AS u ON u.id = t.account \
                    WHERE t.isarchived = false"
          res = await db.any();
          return res;
        */
      } catch (e) { console.log(e); }
    },
    async getGroupTagsAdmin(groupHandles){
      try {
        /*
          var q = "SELECT t.*, u.firstname AS user_fname, u.lastname AS user_lname, \
                      u.isarchived AS user_isarchived FROM tag AS t \
                      LEFT JOIN user AS u ON u.id = t.account \
                      LEFT JOIN tag_group_tag AS tgt ON tgt.tag = t.id \
                      LEFT JOIN tag_group AS tg ON tg.id = tgt.tag_group \
                    WHERE t.isarchived = false AND tg.handle IN ($2:csv)"

          res = await db.any(q, [groupHandles])
          return res;
        */
      } catch (e) { console.log(e); }
    },
    async tagCreate(tag, fieldId, entityId, userId){
      try {
        const q = "with rows as (INSERT INTO tag (handle, account, ispublic) VALUES ($1, $2, false) RETURNING id) \
                    INSERT INTO tag_matrix (tag, field, entity) SELECT id, $3, $4 FROM rows";

        const res = await db.none(q, [tag, userId, fieldId, entityId]);
        sse.blast('tag_matrix');
        return res;
      } catch(e) { console.log(e); }
    }
  }
}
