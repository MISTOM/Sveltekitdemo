//import environment variables
import {createConnection} from 'mysql2/promise'
import {DB_HOST, DB_PASSWORD, DB_NAME, DB_USER} from '$env/static/private'

let connection = null
export const createConn = () => {
    if (!connection) {
        connection = createConnection({
            host: DB_HOST,
            user: DB_USER,
            password: DB_PASSWORD,
            database: DB_NAME,
            port: 3306
        })
    }
    return connection
}