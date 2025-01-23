import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import '../models/post.dart';
import '../services/firestore_service.dart';

class PostProvider with ChangeNotifier {
  final FirestoreService _firestoreService = FirestoreService();

  // Haal posts op als een Stream van Post objecten
  Stream<List<Post>> get posts {
    return _firestoreService.getPosts().map(
      (querySnapshot) {
        // Zet de Firestore data om naar Post objecten
        return querySnapshot.docs.map((doc) {
          return Post.fromFirestore(doc.id, doc.data() as Map<String, dynamic>);
        }).toList();
      },
    );
  }

  // Voeg een nieuwe post toe
  Future<void> addPost(String content, String userId, String fullName) async {
    try {
      final postId =
          FirebaseFirestore.instance.collection('posts').doc().id; // Genereer een nieuwe postId
      final post = Post(
        postId: postId,
        userId: userId,
        fullName: fullName,
        profileImage: '',
        content: content,
        likes: [],
        commentsCount: 0,
        interestId: null,
        visibility: 'public', // Je kunt de zichtbaarheid hier dynamisch instellen
        createdAt: Timestamp.now(),
        comments: [],
      );

      await _firestoreService.addPost(post);
    } catch (e) {
      throw Exception('Error adding post: $e');
    }
  }

  // Toggle like voor een post
  Future<void> toggleLike(
      String postId, String userId, String fullName, String profileImage) async {
    try {
      await _firestoreService.toggleLike(postId, userId, fullName, profileImage);
    } catch (e) {
      throw Exception('Error toggling like: $e');
    }
  }

  Future<void> addComment(String postId, String userId, String fullName, String profileImage,
      String commentContent) async {
    try {
      final newComment = {
        'userId': userId,
        'fullName': fullName,
        'profileImage': profileImage,
        'content': commentContent,
        'createdAt': Timestamp.now(),
      };

      // Verkrijg de huidige post en voeg de nieuwe comment toe aan de lijst
      await _firestoreService.addComment(postId, newComment);

      notifyListeners();
    } catch (e) {
      throw Exception('Error adding comment: $e');
    }
  }
}
