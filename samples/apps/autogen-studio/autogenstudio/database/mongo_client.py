from pymongo import MongoClient
import os

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception as e:
    pass


client = MongoClient(os.getenv("MONGODB_URI"))
db = client.get_database(os.getenv("MONGODB_NAME"))