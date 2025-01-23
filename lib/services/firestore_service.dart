import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/post.dart';

class FirestoreService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  // Haal posts op
  Stream<QuerySnapshot> getPosts() {
    return _db.collection('posts').orderBy('createdAt', descending: true).snapshots();
  }

  // Voeg een post toe
  Future<void> addPost(Post post) async {
    try {
      await _db.collection('posts').doc(post.postId).set(post.toMap());
    } catch (e) {
      throw Exception('Error adding post to Firestore: $e');
    }
  }

  // Toggle like voor een post
  Future<void> toggleLike(
      String postId, String userId, String fullName, String profileImage) async {
    final postRef = _db.collection('posts').doc(postId);
    final postDoc = await postRef.get();

    if (postDoc.exists) {
      final postData = postDoc.data() as Map<String, dynamic>;

      List<Map<String, String>> likes = List<Map<String, String>>.from(postData['likes'] ?? []);
      final userIndex = likes.indexWhere((like) => like['userId'] == userId);

      if (userIndex == -1) {
        // User has not liked the post, so we add the like
        likes.add({
          'userId': userId,
          'fullName': fullName,
          'profileImage': profileImage,
        });
      } else {
        // User already liked the post, so we remove the like
        likes.removeAt(userIndex);
      }

      await postRef.update({
        'likes': likes,
      });
    } else {
      throw Exception('Post not found');
    }
  }
}
