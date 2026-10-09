// Helpers that keep SQL safe: identifiers come from code-owned whitelists, values are always bound params.

/** Builds "col = $n, ..." from a whitelist map { jsKey: 'column_name' }. */
function buildUpdate(map, data, startIndex = 1) {
  const sets = [];
  const values = [];
  for (const [key, column] of Object.entries(map)) {
    if (data[key] !== undefined) {
      values.push(data[key]);
      sets.push(`${column} = $${startIndex + values.length - 1}`);
    }
  }
  return { sets: sets.join(', '), values };
}

/** Collects WHERE fragments; '?' in a fragment is replaced by the next $n placeholder. */
function whereBuilder(initialSql, initialParams) {
  const clauses = [initialSql];
  const params = [...initialParams];
  return {
    add(sql, value) {
      params.push(value);
      clauses.push(sql.replace('?', `$${params.length}`));
    },
    get sql() { return clauses.join(' AND '); },
    params,
  };
}

const pagination = (page, limit) => ({ limit, offset: (page - 1) * limit });
const pageMeta = (page, limit, total) => ({ page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });

module.exports = { buildUpdate, whereBuilder, pagination, pageMeta };
