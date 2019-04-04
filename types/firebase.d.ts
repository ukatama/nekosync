import * as firebase from 'firebase';

declare module 'firebase/app' {
  const App: firebase.app.App;
}

declare module 'firebase/firestore' {
  const Firestore: firebase.firestore.Firestore;
}
