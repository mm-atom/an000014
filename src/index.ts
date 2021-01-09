import { parse } from 'url';
import config from '@mmstudio/config';
import global from '@mmstudio/global';
import anylogger from 'anylogger';
import Pool from 'pg-pool';
import { Client, types } from 'pg';
import { createPool, createPoolCluster, Pool as MPool } from 'mariadb';

const logger = anylogger('@mmstudio/an000014');

types.setTypeParser(types.builtins.INT8, (v) => {
	return BigInt(v);
});

type BaseTable = Record<string, unknown>;

/**
 * sql语句查询
 */
export default function sql_query<T1 = BaseTable, T2 = BaseTable, T3 = BaseTable, T4 = BaseTable, T5 = BaseTable, T6 = BaseTable, T7 = BaseTable, T8 = BaseTable, T9 = BaseTable, T10 = BaseTable, T11 = BaseTable, T12 = BaseTable, T13 = BaseTable, T14 = BaseTable, T15 = BaseTable, T16 = BaseTable, T17 = BaseTable, T18 = BaseTable, T19 = BaseTable, T20 = BaseTable>(db: string, ...sqls: [string, unknown[]][]): Promise<[T1[], T2[], T3[], T4[], T5[], T6[], T7[], T8[], T9[], T10[], T11[], T12[], T13[], T14[], T15[], T16[], T17[], T18[], T19[], T20[]]> {
	const dbs = config.dbs as Record<string, {
		type: 'postgres' | 'mariadb' | 'mysql' | string;
		source: string | string[];
	}>;
	const conf = dbs[db];
	switch (conf.type) {
		case 'postgres':
			return postgres_sql(db, sqls, conf.source as string) as unknown as Promise<[T1[], T2[], T3[], T4[], T5[], T6[], T7[], T8[], T9[], T10[], T11[], T12[], T13[], T14[], T15[], T16[], T17[], T18[], T19[], T20[]]>;
		case 'mysql':
		case 'mariadb':
			return mariadb_sql(db, sqls, conf.source) as unknown as Promise<[T1[], T2[], T3[], T4[], T5[], T6[], T7[], T8[], T9[], T10[], T11[], T12[], T13[], T14[], T15[], T16[], T17[], T18[], T19[], T20[]]>;
		default:
			throw new Error(`not supported dbtype:${conf.type}. all supported db types are: [postgres,mariadb]`);
	}
}

async function mariadb_sql(db: string, sqls: [string, unknown[]][], source: string | string[]) {
	logger.debug('postgres sql:', sqls);
	const pool = mariadb_get_pool(db, source);
	const client = await pool.getConnection();
	try {
		const ret = await Promise.all(sqls.map(([sql, values]) => {
			return client.query(sql, values) as unknown as [unknown];
		}));
		logger.debug('postgres sqlquery result:', ret);
		return ret;
	} finally {
		client.release();
	}
}

const key = 'dbs';

function mariadb_get_pool(db: string, source: string | string[]) {
	const dbs = global(key, {} as { [key: string]: MPool });
	if (!dbs[db]) {
		if (Array.isArray(source)) {
			const cluster = createPoolCluster();
			source.forEach((s, i) => {
				if (i === 0) {
					cluster.add('master', parse_url(s));
				} else {
					cluster.add(`slave${i}`, parse_url(s));
				}
			});
			return cluster;
		}
		dbs[db] = createPool(parse_url(source));
	}
	return dbs[db];
}

// Position the bindings for the query. The escape sequence for question mark
// is \? (e.g. knex.raw("\\?") since javascript requires '\' to be escaped too...)
function position_bindings(sql: string) {
	let questionCount = 0;
	return sql.replace(/(\\*)(\?)/g, (_match, escapes: string) => {
		if (escapes.length % 2) {
			return '?';
		}
		questionCount++;
		return `$${questionCount}`;
	});
}

async function postgres_sql(db: string, sqls: [string, unknown[]][], source: string) {
	logger.debug('postgres sql:', sqls);
	const pool = postgres_get_pool(db, source);
	const client = await pool.connect();
	try {
		const ret = await Promise.all(sqls.map(async ([sql, values]) => {
			const r = await client.query(position_bindings(sql), values);
			return r.rows as [unknown];
		}));
		logger.debug('postgres sqlquery result:', ret);
		return ret;
	} finally {
		client.release();
	}
}

function postgres_get_pool(db: string, source: string) {
	const dbs = global(key, {} as { [key: string]: Pool<Client> });
	if (!dbs[db]) {
		const options = parse_url(source);
		dbs[db] = new Pool(options);
	}
	return dbs[db];
}

function parse_url(url: string) {
	const params = parse(url, true);
	const auth = params.auth!.split(':');
	return {
		debug: true,
		user: auth[0],
		password: auth[1],
		host: params.hostname!,
		port: parseInt(params.port!, 10),
		database: params.pathname!.split('/')[1],
		...params.query
	};
}
