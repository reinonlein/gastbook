import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

class AuthProvider with ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  User? _user;
  Map<String, dynamic>? _userData;
  bool _isLoading = true;

  User? get user => _user;
  Map<String, dynamic>? get userData => _userData;
  bool get isLoading => _isLoading;

  AuthProvider() {
    _auth.authStateChanges().listen(_onAuthStateChanged);
  }

  Future<void> init() async {
    await _auth.authStateChanges().first;
    _isLoading = false;
    notifyListeners();
  }

  Future<void> _onAuthStateChanged(User? user) async {
    _user = user;
    if (_user != null) {
      await _fetchUserData();
    } else {
      _userData = null;
    }
    notifyListeners();
  }

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

      await _firestore.collection('users').doc(userId).set({
        'username': userName,
        'fullName': fullName,
        'firstName': firstName,
        'lastName': lastName,
        'bio': '',
        'profileImage': '',
        'interests': [],
        'friends': {},
        'createdAt': Timestamp.now(),
        'birthDate': null,
        'email': email,
      });

      _user = result.user;
      await _fetchUserData();
    } on FirebaseAuthException catch (e) {
      throw Exception(getFriendlyAuthErrorMessage(e));
    } catch (e) {
      throw Exception('$e');
    }
  }

  Future<void> signOut() async {
    await _auth.signOut();
    _user = null;
    _userData = null;
    notifyListeners();
  }

  Future<void> resetPassword(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email);
    } catch (e) {
      throw Exception('Failed to send password reset email: $e');
    }
  }

  String getFriendlyAuthErrorMessage(FirebaseAuthException e) {
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
