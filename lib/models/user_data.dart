import 'package:cloud_firestore/cloud_firestore.dart';

class UserData {
  final String id;
  final String username;
  final String fullName;
  final String firstName;
  final String lastName;
  final String bio;
  final String profileImage;
  final String favoriteColor;
  final List<String> interests;
  final Map<String, Map<String, String>> friends;
  final Timestamp createdAt;
  final Timestamp? birthDate;

  UserData({
    required this.id,
    required this.username,
    required this.fullName,
    required this.firstName,
    required this.lastName,
    required this.bio,
    required this.profileImage,
    required this.favoriteColor,
    required this.interests,
    required this.friends,
    required this.createdAt,
    this.birthDate,
  });

  // Factory constructor to create a User from Firestore document
  factory UserData.fromFirestore(String id, Map<String, dynamic> data) {
    return UserData(
      id: id,
      username: data['username'] ?? '',
      fullName: data['fullName'] ?? '',
      firstName: data['firstName'] ?? '',
      lastName: data['lastName'] ?? '',
      bio: data['bio'] ?? '',
      profileImage: data['profileImage'] ?? '',
      favoriteColor: data['favoriteColor'] ?? '',
      interests: List<String>.from(data['interests'] ?? []),
      friends: (data['friends'] as Map<String, dynamic>?)?.map((key, value) => MapEntry(
                key,
                Map<String, String>.from(value as Map),
              )) ??
          {},
      createdAt: data['createdAt'] ?? Timestamp.now(),
      birthDate: data['birthDate'],
    );
  }

  // Method to convert User to a Map for Firestore
  Map<String, dynamic> toMap() {
    return {
      'username': username,
      'fullName': fullName,
      'firstName': firstName,
      'lastName': lastName,
      'bio': bio,
      'profileImage': profileImage,
      'favoriteColor': favoriteColor,
      'interests': interests,
      'friends': friends,
      'createdAt': createdAt,
      'birthDate': birthDate,
    };
  }
}
