import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import '../services/firestore_service.dart';

class PostProvider with ChangeNotifier {
  final FirestoreService _firestoreService = FirestoreService();

  Stream<QuerySnapshot> get posts => _firestoreService.getPosts();

  Future<void> addPost(String content, String userId) async {
    try {
      await _firestoreService.addPost(content, userId);
    } catch (e) {
      throw Exception('Error adding post: $e');
    }
  }
}
