export const userTypeDefs = `#graphql
  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
    bio: String
    profilePic: String
    createdAt: String
    updatedAt: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  extend type Query {
    getProfile(userId: ID!): User
    me: User
  }

  extend type Mutation {
    signup(
      name: String!
      email: String!
      password: String!
    ): AuthPayload!

    login(
      email: String!
      password: String!
    ): AuthPayload!

    updateProfile(
      userId: ID!
      name: String
      bio: String
      profilePic: String
    ): User!
  }
`;
