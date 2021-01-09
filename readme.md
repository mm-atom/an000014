# sql查询

数据库查询

## 数据库类型

支持mysql,postgres,mariadb

ts返回类型最大20个,如果超过20个，可直接`as`

## 注意事项

### 需要先确定数据库类型

在进行业务开发时，需要首先确定数据库类型，否则sql有非常大的可能性是无法兼容的。

### long类型

postgres数据库中的长整型转换到js中，类型为`BigInt`,比较小的数值最好设置其类型为`smallint`即可。

`BigInt`与`number`类型计算时，需要将`number`转换为`BigInt`后进行。几种转换方法：

1. `BigInt`to`number`.一般无须进行这种转换，因为有可能会因长度不够而失败

	```ts
	function b2n(v: BigInt){
		return parseInt(v.toString(), 10);
	}
	```

1. `number`to`BigInt`

	```ts
	function n2b(v: number){
		return BigInt(v);
	}
	```

1. `string`to`BigInt`

	```ts
	function n2b(v: string){
		return BigInt(v);
	}
	```

1. `BigInt`to`string`

	```ts
	function n2b(v: BigInt){
		return v.toString();
	}
	```

## 配置

mm.json

```json
{
	"dbs": {
		"db001": {
			"type": "postgres",
			"source": "postgres://mmstudio:Mmstudio123@127.0.0.1:5432/mmstudio"
		},
		"db002": {
			"type": "mariadb",
			"source": "mysql://mmstudio:Mmstudio123@127.0.0.1:3306/mmstudio?connectionLimit=5"
		},
		"db003": {
			"type": "mariadb",
			"source": [
				"mysql://mmstudio:Mmstudio123@127.0.0.1:3306/mmstudio?connectionLimit=5",
				"mysql://mmstudio:Mmstudio123@127.0.0.1:3307/mmstudio?connectionLimit=5",
				"mysql://mmstudio:Mmstudio123@127.0.0.1:3308/mmstudio?connectionLimit=5"
			]
		}
	}
}
```

### 说明

1. 项目下的配置会在部署时被覆盖
1. 配置文件名固定mm.json，且须放置在项目根目录
1. dbs下的名称`db001`,`db002`,`db003`视具体情况配置，个数不定，简单项目使用一个数据库亦可。
1. `type`目前只支持`postgres`和`mariadb`两种，`mariadb`与mysql通用
1. `mariadb`支持主从节点配置如`db003`,配置项的第一个将作为主节点

## docker-compose

[docker-compose安装](https://download.daocloud.io/Docker_Mirror/Docker_Compose)

```sh
[sudo] docker-compose -f db.yaml up
```

db.yaml

```yaml
version: '3.7'

services:
  postgres:
    image: postgres
    container_name: postgres
    volumes:
      - /home/taoqf/data/postgre:/var/lib/postgresql/data
    restart: always
    environment:
      POSTGRES_DB: mmstudio
      POSTGRES_USER: mmstudio
      POSTGRES_PASSWORD: Mmstudio123
    ports:
      - 5432:5432

  mariadb:
    image: mariadb
    container_name: mariadb
    restart: always
    volumes:
      - /home/taoqf/data/mysql:/var/lib/mysql
    environment:
      MYSQL_DATABASE: mmstudio
      MYSQL_USER: mmstudio
      MYSQL_PASSWORD: Mmstudio123
      MYSQL_ROOT_PASSWORD: Mmstudio123
    ports:
      - 3306:3306

  adminer:
    container_name: adminer
    image: adminer
    restart: always
    ports:
      - 8080:8080
# networks:
#   default:
```
