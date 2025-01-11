import 'package:cloud_firestore/cloud_firestore.dart';

class FirestoreService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Future<void> addPost(String content, String userId) async {
    try {
      await _firestore.collection('posts').add({
        'content': content,
        'userId': userId,
        'timestamp': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      throw Exception('Failed to add post: $e');
    }
  }

  Stream<QuerySnapshot> getPosts() {
    return _firestore.collection('posts').orderBy('timestamp', descending: true).snapshots();
  }
}
