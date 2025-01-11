import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

class AuthProvider with ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  User? _user;
  Map<String, dynamic>? _userData;

  User? get user => _user;
  Map<String, dynamic>? get userData => _userData;

  AuthProvider() {
    _auth.authStateChanges().listen(_onAuthStateChanged);
  }

  // Methode om de status van de gebruiker bij te werken
  Future<void> _onAuthStateChanged(User? user) async {
    _user = user;
    if (_user != null) {
      await _fetchUserData();
    } else {
      _userData = null;
    }
    notifyListeners();
  }

  // Haal gebruikersdata op uit Firestore
  Future<void> _fetchUserData() async {
    if (_user == null) return;
    final doc = await _firestore.collection('users').doc(_user!.uid).get();
    if (doc.exists) {
      _userData = doc.data();
    } else {
      _userData = {
        'name': 'Unknown User',
        'email': _user!.email ?? '',
        'photoUrl': '',
      };
    }
    notifyListeners();
  }

  // Inloggen met email en wachtwoord
  Future<void> signInWithEmailAndPassword(String email, String password) async {
    try {
      await _auth.signInWithEmailAndPassword(email: email, password: password);
      await _fetchUserData();
    } catch (e) {
      throw Exception('Failed to sign in: $e');
    }
  }

  // Registratie van een nieuwe gebruiker met een unieke displaynaam
  Future<void> registerUser(String email, String password, String displayName) async {
    final firestore = FirebaseFirestore.instance;
    try {
      // Controleer of de displaynaam al bestaat in de database
      final existingDisplayName = await firestore.collection('displaynames').doc(displayName).get();

      if (existingDisplayName.exists) {
        throw Exception('Display name already taken. Please choose another one.');
      }

      // Maak de gebruiker aan in Firebase Auth
      final result = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
      final userId = result.user!.uid;

      // Voeg de displaynaam toe aan de 'displaynames'-collectie
      await firestore.collection('displaynames').doc(displayName).set({
        'uid': userId,
      });

      // Voeg de gebruiker toe aan de 'users'-collectie
      await firestore.collection('users').doc(userId).set({
        'name': displayName,
        'email': email,
        'photoUrl': '', // Lege waarde voor de profielfoto
      });

      _user = result.user;
      await _fetchUserData();
    } catch (e) {
      throw Exception('Failed to register: $e');
    }
  }

  // Uitloggen van de gebruiker
  Future<void> signOut() async {
    await _auth.signOut();
    _user = null;
    _userData = null;
    notifyListeners();
  }

  // Wachtwoord reset verzoek
  Future<void> resetPassword(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email);
    } catch (e) {
      throw Exception('Failed to send password reset email: $e');
    }
  }

  // Profielfoto-updates en andere gebruikersgegevens kunnen later worden toegevoegd
}