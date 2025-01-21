import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import '../services/firestore_service.dart';

class PostProvider with ChangeNotifier {
  final FirestoreService _firestoreService = FirestoreService();

  Stream<QuerySnapshot> get posts => _firestoreService.getPosts();

  Future<void> addPost(String content, String userId, String fullName) async {
    try {
      await _firestoreService.addPost(content, userId, fullName);
    } catch (e) {
      throw Exception('Error adding post: $e');
    }
  }

  Future<void> toggleLike(
      String postId, String userId, String fullName, String profileImage) async {
    try {
      await _firestoreService.toggleLike(postId, userId, fullName, profileImage);
    } catch (e) {
      throw Exception('Error toggling like: $e');
    }
  }
}
