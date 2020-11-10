module.exports = (db, sse) => {
  const fieldTypeJson = require('./field_types.json');

  return {
    async allFieldTypeSettings(){ return fieldTypeJson; },
    async create(args){
      try {
        const q = "INSERT INTO field (name, handle, data_type, settings) VALUES ($1, $2, $3, $4:json) RETURNING id",
            settings = {};

        for(const setting of fieldTypeJson[args.data_type].settings){
          if(setting.type == "boolean"){
            settings[setting.handle] = args[setting.handle] === "true" ? true : false;
          } else if(setting.type == "integer") {
            settings[setting.handle] = parseInt(args[setting.handle]);
          } else if(setting.type == "number") {
            settings[setting.handle] = Number(args[setting.handle]);
          } else if(setting.type == "source") {
            settings[setting.handle] = [];

            if(args[setting.handle].length > 1){
              for(const source of args[setting.handle]){
                settings[setting.handle].push(parseInt(source));
              }
            } else { settings[setting.handle].push(parseInt(args[setting.handle])); }

          } else if(setting.type == "repeating") {
            const fieldCount = args.value.length,
                repeatingFieldSettings = [];

            if(fieldCount > 1){
              for(let i = 0; i < fieldCount; i++) {
                let repeatingFieldRow = {};
                for(const field of setting.fields){
                  if(field.type == "boolean"){
                    repeatingFieldRow[field.handle] = args[field.handle][i] === "true" ? true : false;
                  } else if(field.type == "integer") {
                    repeatingFieldRow[field.handle] = parseInt(args[field.handle][i]);
                  } else if(field.type == "number") {
                    repeatingFieldRow[field.handle] = Number(args[field.handle][i]);
                  } else if(field.type == "default") {
                    repeatingFieldRow[field.handle] = (args.repeating_default_match[i] == args[field.handle]);
                  } else {
                    repeatingFieldRow[field.handle] = args[field.handle][i];
                  }
                }
                repeatingFieldSettings.push(repeatingFieldRow);
              }
            } else {
              let repeatingFieldRow = {};
              for(const field of setting.fields){
                if(field.type == "boolean"){
                  repeatingFieldRow[field.handle] = args[field.handle] === "true" ? true : false;
                } else if(field.type == "integer") {
                  repeatingFieldRow[field.handle] = parseInt(args[field.handle]);
                } else if(field.type == "number") {
                  repeatingFieldRow[field.handle] = Number(args[field.handle]);
                } else if(field.type == "default") {
                  repeatingFieldRow[field.handle] = true;
                } else {
                  repeatingFieldRow[field.handle] = args[field.handle]
                }
              }
              repeatingFieldSettings.push(repeatingFieldRow);
            }

            settings[setting.handle] = repeatingFieldSettings;
          } else {
            settings[setting.handle] = args[setting.handle]
          }
        }

        const res = await db.one(q, [args.name, args.handle, args.data_type, settings]);

        if(args.data_type != "entities"
          && args.data_type != "tags"
          && args.data_type != "dropdown"
          && args.data_type != "checkboxes"
          && args.data_type != "radio"){
          const dataType = fieldTypeJson[args.data_type].dataTypes[0].type;
          await db.none("ALTER TABLE content ADD COLUMN $1~ $2^", [args.handle, dataType]);
        } else if((args.data_type == "dropdown" || args.data_type == "checkboxes"
          || args.data_type == "radio") && settings.options.length > 0) {
          let optionQ = "INSERT INTO select_option (field, value) VALUES ($1, $2)";
              optionQParams = [res.id, settings.options[0].value];

          for(let i = 3; i <= (settings.options.length + 1); i++){
            optionQ += ", ($1, $"+i+")";
            optionQParams.push(settings.options[i-2].value)
          }

          await db.none(optionQ, optionQParams);
        }

        sse.blast('field');
        return res;
      } catch(e) { console.log(e); }
    },
    async update(ogField, args){
      try {
        if(args.handle != "name"
          && args.data_type != "entities"
          && args.data_type != "tags"
          && args.data_type != "dropdown"
          && ogField.handle != args.handle){
          const ogFieldHandle = "field_"+ogField.handle,
                newFieldHandle = "field_"+args.handle
          await db.none("ALTER TABLE content RENAME COLUMN $1~ to $2~",
            [ogFieldHandle, newFieldHandle])
        }
      } catch(e) { console.log(e); }
    },
    async fieldTypeSettings(type){
      return fieldTypeJson[type].settings;
    },
    async adminFieldAccess(accessTable, accountGroup, entityType){
      try {
        var q = "SELECT a.*, ef.id AS entity_type_field_id, a.id AS root_id, f.name AS name \
                  FROM entity_type_field AS ef \
                    LEFT JOIN field AS f ON f.id = ef.field \
                  	LEFT JOIN (SELECT * FROM $1~ \
                  		WHERE isarchived = false AND account_group = $2) AS a \
                   	 	ON a.entity_type_field = ef.id \
                  WHERE ef.entity_type = $3 AND ef.isarchived = false \
                    AND f.isarchived = false \
                  ORDER BY ef.created",
            qParams = [accessTable, accountGroup, entityType];

        var res = await db.any(q, qParams);
        return res;
      } catch(e) { console.log(e); }
    }
  }
}
