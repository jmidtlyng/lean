module.exports = (db, sse) => {
  return {
    async getTags(userId, search=false){
      try {
        var q = "",
            res = [];

        if(search) {
          q = "SELECT * FROM tag WHERE isarchived = false AND (public = true OR user = $1) AND name LIKE $2";
          res = await db.any(q, [userId, search]);
        } else {
          q = "SELECT * FROM tag WHERE isarchived = false AND (public = true OR user = $1)";
          res = await db.any(q, [userId]);
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
                  LEFT JOIN tag_group AS tg ON tg.id = tgt.group \
                WHERE (t.public = true OR t.user = $1) AND t.isarchived = false \
                  AND tg.handle IN ($2:csv) AND t.name LIKE $3";
          res = await db.any(q, [userId, groupHandles, search]);
        } else {
          q = "SELECT t.* FROM tag AS t \
                  LEFT JOIN tag_group_tag AS tgt ON tgt.tag = t.id \
                  LEFT JOIN tag_group AS tg ON tg.id = tgt.group \
                WHERE (t.public = true OR t.user = $1) AND t.isarchived = false \
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
                      LEFT JOIN user AS u ON u.id = t.user \
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
                      LEFT JOIN user AS u ON u.id = t.user \
                      LEFT JOIN tag_group_tag AS tgt ON tgt.tag = t.id \
                      LEFT JOIN tag_group AS tg ON tg.id = tgt.group \
                    WHERE t.isarchived = false AND tg.handle IN ($2:csv)"

          res = await db.any(q, [groupHandles])
          return res;
        */
      } catch (e) { console.log(e); }
    }
  }
}
