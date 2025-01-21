import 'package:cloud_firestore/cloud_firestore.dart';

class FirestoreService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Stream<QuerySnapshot> getPosts() {
    return _firestore.collection('posts').orderBy('createdAt', descending: true).snapshots();
  }

  Future<void> addPost(String content, String userId, String fullName) async {
    try {
      // Maak een nieuw document in de 'posts' collectie
      DocumentReference postRef = await _firestore.collection('posts').add({
        'content': content,
        'userId': userId,
        'fullName': fullName,
        'profileImage': '', // Leeg veld voor nu, kan later worden ingevuld
        'likes': [],
        'comments': [],
        'createdAt': Timestamp.now(),
        'showComments':
            false, // Je kunt een boolean toevoegen om te controleren of de comments zichtbaar zijn
      });

      // Na het toevoegen van de post, sla de document ID op in het document zelf
      await postRef.update({'postId': postRef.id});
    } catch (e) {
      throw Exception('Error adding post: $e');
    }
  }

  Future<void> toggleLike(
      String postId, String userId, String fullName, String profileImage) async {
    final postRef = _firestore.collection('posts').doc(postId);

    final snapshot = await postRef.get();
    if (!snapshot.exists) return;

    final post = snapshot.data()!;
    final likes = List.from(post['likes'] ?? []);

    if (likes.any((like) => like['userId'] == userId)) {
      likes.removeWhere((like) => like['userId'] == userId);
    } else {
      likes.add({
        'userId': userId,
        'fullName': fullName,
        'profileImage': profileImage,
      });
    }

    await postRef.update({'likes': likes});
  }
}
