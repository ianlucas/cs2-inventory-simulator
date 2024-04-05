# Increment Item StatTrak

curl -X POST \
  http://localhost:3000/api/increment-item-stattrak \
  -H 'Content-Type: application/json' \
  -d '{
    "apiKey": "api key",
    "userId": "steam id",
    "targetUid": 0
}' -i;

# Sign-in User

curl -X POST \
  http://localhost:3000/api/sign-in \
  -H 'Content-Type: application/json' \
  -d '{
    "apiKey": "api key",
    "userId": "steam id"
}' -i;
