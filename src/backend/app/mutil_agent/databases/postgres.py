import time
import logging
import psycopg2
from fastapi import Depends
from typing import Optional, Dict, List, Any, Union
from app.mutil_agent.config import PG_DATABASE, PG_USER, PG_HOST, PG_PASSWORD, PG_PORT


def get_postgres_connection():
    """Ensures the database connection is established."""
    return PostgreSQLSingleton().connection


def get_postgres_service(
    _: Any = Depends(get_postgres_connection),
) -> "PostgreSQLSingleton":
    """FastAPI dependency to inject the PostgresService singleton."""
    return PostgreSQLSingleton()


class PostgreSQLSingleton:
    _instance: Optional["PostgreSQLSingleton"] = None
    _connection: Optional[psycopg2.extensions.connection] = None

    def __new__(cls) -> "PostgresService":
        """Enforce the singleton pattern."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize_connection()
        return cls._instance

    def _initialize_connection(self) -> None:
        if self._connection is None:
            try:
                # Create a connection if one doesn't exist
                self._connection = psycopg2.connect(
                    database=PG_DATABASE,
                    user=PG_USER,
                    host=PG_HOST,
                    password=PG_PASSWORD,
                    port=PG_PORT,
                )
                self.num_retries = 3

                print(
                    "POSTGRES_CONNECTION - Database connection established successfully"
                )
            except Exception as e:
                logging.error(
                    f"POSTGRES_CONNECTION - Error establishing database connection: {e}"
                )
                self._connection = None

    @property
    def connection(self):
        return self._connection

    def get_cursor(self):
        """Returns a new database cursor, ensuring the connection is valid."""
        if self._connection is None:
            raise ConnectionError("POSTGRES_CONNECTION - No active database connection")
        return self._connection.cursor()

    def close(self) -> None:
        """Closes the database connection."""
        if self._connection:
            self._connection.close()
            self._connection = None
            print("POSTGRES_CONNECTION - Database connection closed")

    def execute_query(
        self,
        query: str,
        params: Optional[Union[tuple, Dict[str, Any]]] = None,
        fetch: bool = True,
    ):
        """Executes a query and fetches results if needed."""
        if self._connection is None:
            logging.error("POSTGRES_CONNECTION - No active database connection")
            return None, None

        for attempt in range(self.num_retries):
            cursor = None
            try:
                cursor = self.get_cursor()
                cursor.execute(query, params if params else ())

                if query.strip().upper().startswith("SELECT"):
                    if fetch is True:
                        columns = [desc[0] for desc in cursor.description]
                        return columns, cursor.fetchall()

                    return None, None
                else:
                    self._connection.commit()
                    return None, None

            except Exception as error:
                self._connection.rollback()
                logging.error(
                    f"POSTGRES_EXECUTE - Attempt {attempt + 1} failed executing query: {error}"
                )
                time.sleep(3)

            finally:
                if cursor:
                    cursor.close()

        logging.error("POSTGRES_EXECUTE - All attempts to execute query failed")
        return None, None
