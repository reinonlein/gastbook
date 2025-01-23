import 'package:cloud_firestore/cloud_firestore.dart';

class Post {
  final String postId;
  final String userId;
  final String fullName;
  final String profileImage;
  final String content;
  final List<Map<String, String>>
      likes; // [{ userId: string, fullName: string, profileImage: string }]
  final int commentsCount;
  final String? interestId;
  final String visibility; // 'public' | 'friends' | 'interest'
  final Timestamp createdAt;
  final List<Map<String, dynamic>>
      comments; // [{ commentId: string, authorId: string, fullName: string, profileImage: string, content: string, createdAt: timestamp }]

  Post({
    required this.postId,
    required this.userId,
    required this.fullName,
    required this.profileImage,
    required this.content,
    required this.likes,
    required this.commentsCount,
    required this.interestId,
    required this.visibility,
    required this.createdAt,
    required this.comments,
  });

  // Factory constructor to create a Post from Firestore document
  factory Post.fromFirestore(String postId, Map<String, dynamic> data) {
    return Post(
      postId: postId,
      userId: data['userId'] ?? '',
      fullName: data['fullName'] ?? '',
      profileImage: data['profileImage'] ?? '',
      content: data['content'] ?? '',
      likes: List<Map<String, String>>.from(
        (data['likes'] ?? []).map((like) => Map<String, String>.from(like as Map)),
      ),
      commentsCount: data['commentsCount'] ?? 0,
      interestId: data['interestId'], // Could be null
      visibility: data['visibility'] ?? 'public',
      createdAt: data['createdAt'] ?? Timestamp.now(),
      comments: List<Map<String, dynamic>>.from(
        (data['comments'] ?? []).map((comment) => Map<String, dynamic>.from(comment as Map)),
      ),
    );
  }

  // Method to convert Post to a Map for Firestore
  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'fullName': fullName,
      'profileImage': profileImage,
      'content': content,
      'likes': likes,
      'commentsCount': commentsCount,
      'interestId': interestId,
      'visibility': visibility,
      'createdAt': createdAt,
      'comments': comments,
    };
  }
}
