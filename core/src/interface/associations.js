module.exports = (db) => {
  return {
    async associatedEntities(userId, parentId, fieldId){
      try {
        q = "SELECT em.id AS matrix_id, c.name, e.id, et.handle AS entity_type_handle, et.name AS entity_type_name, \
                pt.handle AS parent_type_handle, pt.name AS parent_type_name, f.handle AS field_handle, \
                g.account_group_handle \
              FROM entity_matrix AS em \
                LEFT JOIN (SELECT * FROM entity WHERE isarchived = false) AS e \
                  ON e.id = em.entity \
                LEFT JOIN entity AS p ON p.id = em.parent \
                LEFT JOIN content AS c ON c.entity = e.id \
                LEFT JOIN entity_type AS et ON et.id = e.entity_type \
                LEFT JOIN entity_type AS pt ON pt.id = p.entity_type \
                LEFT JOIN field AS f ON f.id = em.field \
                LEFT JOIN (SELECT ea.entity AS entity, ag.handle AS account_group_handle \
                  FROM entity_account AS ea LEFT JOIN account_group AS ag ON ag.id = ea.account_group \
                  WHERE ea.isarchived = false AND ea.account = $1) AS g ON g.entity = p.id \
              WHERE em.isarchived = false AND em.parent = $2 AND em.field = $3";

        var result = await db.any(q, [userId, parentId, fieldId]);
        return result;
      } catch(e){ console.log(e); }
    },
    async unassociatedEntities(parentId, fieldId){
      try {
        q = "SELECT c.name, e.id, et.handle AS entity_type_handle, et.name AS entity_type_name \
              FROM entity AS e \
                LEFT JOIN (SELECT * FROM entity_matrix WHERE isarchived = false \
                  AND parent = $1 AND field = $2) AS em ON em.entity = e.id \
                LEFT JOIN content AS c ON c.entity = e.id \
                LEFT JOIN entity_type AS et ON et.id = e.entity_type \
              WHERE e.isarchived = false AND em.entity IS NULL";

        var result = await db.any(q, [parentId, fieldId]);
        return result;
      } catch(e){ console.log(e); }
    },
    async createAssociation(parent, child, fieldHandle){
      try {
        const q = "INSERT INTO entity_matrix (field, parent, entity) \
                    SELECT id, $1, $2 FROM fields WHERE handle = $3 \
                      AND isarchived = false";

        const res = await db.none(q, [parent, child, fieldHandle]);
        // const sseEvent = 'entity_id_'+parent+'_field_'+fieldHandle;
        sse.blast('content');
        return res;
      } catch(e){ throw e }
    }
  }
}
