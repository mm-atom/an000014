const test = require('ava');

const { default: a } = require('../dist/index');

test.before(async () => {
	await a('db001',
		['drop table if exists tb001;'],
		['create table tb001 (name text);'],
		[`insert into tb001 (name) values ($1),($2),($3);`, ['mmstudio001', 'mmstudio002', 'mmstudio003']]
	);
	await a('db002',
		['drop table if exists tb001;'],
		['create table tb001 (name text);'],
		[`insert into tb001 (name) values (?),(?),(?);`, ['mmstudio001', 'mmstudio002', 'mmstudio003']]
	);
});

test.after(async () => {
	await a('db001', ['drop table if exists tb001;']);
	await a('db002', ['drop table if exists tb001;']);
});

test('postgres query', async (t) => {
	const [r] = await a('db001', ['select * from tb001']);
	console.warn(r);
	t.assert(r.length === 3);
});

test('postgres count', async (t) => {
	const [r] = await a('db001', ['select count(*) as cnt from tb001']);
	console.error('11111', r);
	t.is(r[0].cnt, 3n);
});

test('mariadb query', async (t) => {
	const [r] = await a('db002', [`select * from tb001`]);
	t.assert(r.length === 3);
});
