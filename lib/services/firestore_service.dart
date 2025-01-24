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
    await Future.delayed(const Duration(milliseconds: 400));

    final postRef = _db.collection('posts').doc(postId);
    final postDoc = await postRef.get();

    if (postDoc.exists) {
      final postData = postDoc.data() as Map<String, dynamic>;

      // Cast de likes lijst naar een List<Map<String, dynamic>>
      List<Map<String, dynamic>> likes = List<Map<String, dynamic>>.from(postData['likes'] ?? []);

      // Zorg ervoor dat je de juiste types gebruikt in de map
      final userIndex = likes.indexWhere((like) => like['userId'] == userId);

      if (userIndex == -1) {
        // Als de gebruiker nog niet heeft geliked, voeg de like toe
        likes.add({
          'userId': userId,
          'fullName': fullName,
          'profileImage': profileImage,
        });
      } else {
        // Als de gebruiker al heeft geliked, verwijder de like
        likes.removeAt(userIndex);
      }

      // Update de likes in Firestore
      await postRef.update({
        'likes': likes,
      });
    } else {
      throw Exception('Post not found');
    }
  }

  // Voeg een nieuwe comment toe aan de post
  Future<void> addComment(String postId, Map<String, dynamic> newComment) async {
    try {
      // Haal de huidige post op
      final postRef = _db.collection('posts').doc(postId);
      final postSnapshot = await postRef.get();
      if (!postSnapshot.exists) {
        throw Exception('Post not found');
      }

      // Verkrijg de huidige comments lijst
      List<Map<String, dynamic>> comments =
          List<Map<String, dynamic>>.from(postSnapshot.data()?['comments'] ?? []);

      // Voeg de nieuwe comment toe aan de lijst
      comments.add(newComment);

      // Update de post met de nieuwe lijst van comments
      await postRef.update({
        'comments': comments,
        'commentsCount': FieldValue.increment(1),
      });
    } catch (e) {
      throw Exception('Error adding comment: $e');
    }
  }
}
