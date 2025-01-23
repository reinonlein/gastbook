import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import 'package:flutter/material.dart';
import 'package:gastbook/models/user_data.dart';

class AuthProvider with ChangeNotifier {
  final firebase_auth.FirebaseAuth _auth = firebase_auth.FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  firebase_auth.User? _firebaseUser;
  UserData? _user;
  bool _isLoading = true;

  firebase_auth.User? get firebaseUser => _firebaseUser;
  UserData? get user => _user;
  bool get isLoading => _isLoading;

  AuthProvider() {
    _auth.authStateChanges().listen(_onAuthStateChanged);
  }

  Future<void> init() async {
    await _auth.authStateChanges().first;
    _isLoading = false;
    notifyListeners();
  }

  Future<void> _onAuthStateChanged(firebase_auth.User? user) async {
    _firebaseUser = user;
    if (_firebaseUser != null) {
      await _fetchUserData();
    } else {
      _user = null; // Bij geen ingelogde gebruiker, zet _user naar null
    }
    notifyListeners();
  }

  Future<void> _fetchUserData() async {
    if (_firebaseUser == null) return;
    final doc = await _firestore.collection('users').doc(_firebaseUser!.uid).get();
    if (doc.exists) {
      _user = UserData.fromFirestore(doc.id, doc.data()!);
    } else {
      _user = null; // Als de gebruiker niet bestaat in de Firestore, zet _user naar null
    }
    notifyListeners();
  }

  Future<UserData?> fetchUserById(String userId) async {
    final doc = await _firestore.collection('users').doc(userId).get();
    if (doc.exists) {
      return UserData.fromFirestore(doc.id, doc.data()!); // Gebruik UserData in plaats van User
    }
    return null;
  }

  Future<void> signInWithEmailAndPassword(String email, String password) async {
    try {
      await _auth.signInWithEmailAndPassword(email: email, password: password);
      await _fetchUserData();
    } catch (e) {
      throw Exception('Failed to sign in: $e');
    }
  }

  Future<void> registerUser({
    required String email,
    required String password,
    required String userName,
    required String firstName,
    required String lastName,
  }) async {
    try {
      final existingUserName = await _firestore.collection('usernames').doc(userName).get();

      if (existingUserName.exists) {
        throw Exception('Username already taken. Please choose another one.');
      }

      final result = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
      final userId = result.user!.uid;

      await _firestore.collection('usernames').doc(userName).set({
        'uid': userId,
      });

      final fullName = '$firstName $lastName';

      final newUser = UserData(
        // Verander 'User' naar 'UserData'
        id: userId,
        username: userName,
        fullName: fullName,
        firstName: firstName,
        lastName: lastName,
        bio: '',
        profileImage: '',
        favoriteColor: '',
        interests: [],
        friends: {},
        createdAt: Timestamp.now(),
        birthDate: null,
      );

      await _firestore.collection('users').doc(userId).set(newUser.toMap());

      _firebaseUser = result.user;
      _user = newUser; // Zet _user naar de nieuwe gebruiker
      notifyListeners();
    } on firebase_auth.FirebaseAuthException catch (e) {
      throw Exception(getFriendlyAuthErrorMessage(e));
    } catch (e) {
      throw Exception('$e');
    }
  }

  Future<void> signOut() async {
    await _auth.signOut();
    _firebaseUser = null;
    _user = null;
    notifyListeners();
  }

  Future<void> resetPassword(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email);
    } catch (e) {
      throw Exception('Failed to send password reset email: $e');
    }
  }

  String getFriendlyAuthErrorMessage(firebase_auth.FirebaseAuthException e) {
    switch (e.code) {
      case 'email-already-in-use':
        return 'This email address is already in use. Please try logging in or use a different email address.';
      case 'invalid-email':
        return 'The email address you entered is invalid. Please check it and try again.';
      case 'operation-not-allowed':
        return 'Email/password registration is currently disabled. Please contact the administrator.';
      case 'weak-password':
        return 'The password is too weak. Please choose a stronger password with at least 6 characters.';
      case 'user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'too-many-requests':
        return 'Too many requests. Please try again later.';
      default:
        return e.message ?? 'Could not register with these credentials. Please try again.';
    }
  }
}
