module.exports = (db, sse) => {
  fieldInterface = require('./field.js')(db);

  return {
    async query(table, args){
      try {
        var q = "SELECT * FROM $1~ WHERE isarchived = false",
            qParams = [table],
            i = 1;

        for(const prop in args){
          i++;
          q += " AND $" + i + "~ = ";
          i++;
          q += "$" + i;

          qParams.push(prop, args[prop]);
        }

        q += " ORDER BY created";

        var res = await db.any(q, qParams);
        return res;
      } catch(e){ throw e }
    },
    async leftJoinQuery(table, joinTable, args){
      return await joinQuery(table, joinTable, args, "LEFT");
    },
    async rightJoinQuery(table, joinTable, args){
      return await joinQuery(table, joinTable, args, "RIGHT");
    },
    async leftNullJoinQuery(table, leftJoinedTable, args){
      return await nullJoinQuery(table, leftJoinedTable, args, 'LEFT');
    },
    async rightNullJoinQuery(table, rightJoinedTable, args){
      return nullJoinQuery(table, rightJoinedTable, args, 'RIGHT');
    },
    async create(table, args){
      try {
        var q = "INSERT INTO $1~ (";
            qFields = "",
            qValues = "",
            qParams = [table],
            i = 1;

        for(const prop in args){
          i++;
          if(i > 2){
            qFields += ', ';
            qValues += ', ';
          }
          qFields += "$" + i + "~";
          i++;
          qValues += "$" + i;
          qParams.push(prop, args[prop]);
        }

        q = q + qFields + ") VALUES (" + qValues + ")";

        var res = await db.none(q, qParams);
        sse.blast(table);
        return res;
      } catch(e){ throw e }
    },
    async update(table, args){
      try {
        var q = "UPDATE $1~ SET ";
            qParams = [table],
            i = 1,
            originalField = {};

        for(const prop in args){
          if(prop != "id"){
            i++;
            if(i > 2){ q += ', '; }
            q += "$" + i + "~ =";
            i++;
            q += " $" + i;
            qParams.push(prop, args[prop]);
          }
        }

        i++;
        q += " WHERE id = $" + i;
        qParams.push(args.id);

        if(table == "field"){
          originalField = await db.one("SELECT handle, data_type, settings FROM field WHERE id = $1", [args.id]);
        }

        var res = await db.none(q, qParams);
        if(table == "field"){ fieldInterface.update(originalField, args); }

        sse.blast(table);
        return res;
      } catch(e){ throw e }
    },
    async archive(table, args){
      try {
        var q = "UPDATE $1~ SET isarchived = true WHERE",
            qParams = [table],
            i = 1;

        for(const prop in args){
          i++;
          if(i > 2){ q += " AND"; }

          q += " $" + i + "~ = ";
          i++;
          q += " $" + i;

          qParams.push(prop, args[prop]);
        }

        var res = await db.none(q, qParams);
        sse.blast(table);
        return res;
      } catch(e){ throw e }
    }
  };

  async function joinQuery(table, joinTable, args, direction) {
    try {
      var q = "SELECT *, a.id AS root_id FROM (SELECT * FROM $1~ WHERE isarchived = false",
          qParams = [table],
          i = 1;

      for(const prop in args){
        i++;
        q += " AND $" + i + "~ = ";
        i++;
        q += "$" + i;

        qParams.push(prop, args[prop]);
      }

      i++;
      q += ") AS a " + direction + " JOIN $" + i + "~ AS b ON b.id = a.$"
        + i + "~ WHERE b.isarchived = false";
      qParams.push(joinTable);

      q += (direction == "LEFT") ? " ORDER BY a.created" : " ORDER BY b.created";

      var res = await db.any(q, qParams);
      return res;
    } catch(e){ throw e }
  }

  async function nullJoinQuery(table, joinTable, args, direction){
    try {
      var q = "SELECT *, a.id AS root_id FROM (SELECT * FROM $1~ WHERE isarchived = false",
          qParams = [table],
          i = 1;

      for(const prop in args){
        i++;
        q += " AND $" + i + "~ IN (";
        i++;
        q += "$" + i + ":csv)";

        qParams.push(prop, args[prop]);
      }

      i++;

      q += ") AS a " + direction + " JOIN $" + i + "~ AS b ON b.id = a.$" + i
        + "~ WHERE a.$" + i + "~ IS NULL AND b.isarchived = false";
      qParams.push(joinTable);

      q += (direction == "LEFT") ? " ORDER BY a.created" : " ORDER BY b.created";

      var res = await db.any(q, qParams);
      return res;
    } catch(e){ throw e }
  }
}
