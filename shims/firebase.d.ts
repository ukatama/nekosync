import * as firebase from 'firebase';

declare module 'firebase/app' {
  const App: firebase.app.App;
  export default App;
}

declare module 'firebase/firestore' {
  const Firestore: firebase.firestore.Firestore;
  export default Firestore;
}
