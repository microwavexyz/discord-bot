import express, { Request, Response } from 'express';
import path from 'path';
import passport from 'passport';
import session from 'express-session';
import { Strategy as LocalStrategy } from 'passport-local';
import { Server } from 'socket.io';
import http from 'http';
import { client } from './index';
import { getUsers } from './utils/dataManager';
import { EmbedBuilder } from 'discord.js';
import config from './config.json'; // Ensure this import line is present

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3000;

// Dummy user data for authentication
const users = [{ id: 1, username: 'admin', password: 'password' }];

// Passport.js setup
passport.use(new LocalStrategy((username, password, done) => {
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return done(null, false, { message: 'Invalid credentials' });
  }
  return done(null, user);
}));

passport.serializeUser((user, done) => {
  done(null, (user as any).id);
});

passport.deserializeUser((id, done) => {
  const user = users.find(u => u.id === id);
  done(null, user);
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

const ensureAuthenticated = (req: Request, res: Response, next: () => void) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};

app.get('/login', (req: Request, res: Response) => {
  res.render('login', { title: 'Login' });
});

app.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login'
}));

app.get('/', ensureAuthenticated, (req: Request, res: Response) => {
  res.render('index', { title: 'Dashboard', botName: client.user?.username });
});

app.get('/users', ensureAuthenticated, async (req: Request, res: Response) => {
  const users = await getUsers(client);
  res.render('users', { title: 'Users', users });
});

export const startDashboard = () => {
  server.listen(port, () => {
    console.log(`Dashboard running at http://localhost:${port}`);
  });
};
