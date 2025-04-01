# Teleguessr
## A Geoguessr clone for Telecom Paris

### Backend
The backend is a pocketbase app. We provide a pocketbase app exemple for developpement in the `backend` directory. You can run it with the following command:
```bash
cd backend
./pocketbase serve -http://localhost:8080
```
The credentials are:
- username: `myadmin@myemail.com`
- password: `mypassword`

You will need to set the floors plan images in the plane collection, then create your panoramas, link them together, create a map, a world, and finally a game.
You also need to create users

### Frontend
The frontend is a Svelte app.
You first need to provide the url of the pocketbase and a google maps api key in the `frontend/.env` file.
You can then run it with the following command:
```bash
cd frontend
npm install
npm run dev
```
/!\ .env variables are fed to the app at build time, so you need to rebuild the app after changing them
