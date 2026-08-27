from app.database.database import engine


try:
    connection = engine.connect()

    print("PostgreSQL connection successful!")

    connection.close()

except Exception as error:
    print("PostgreSQL connection failed:")
    print(error)