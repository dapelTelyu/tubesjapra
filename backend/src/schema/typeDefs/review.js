export const reviewTypeDefs = `#graphql
  type Review {
    id: ID!
    cafeId: ID!
    userId: ID!
    rating: Int!
    reviewText: String
    createdAt: String
    updatedAt: String
    user: User
    cafe: Cafe
  }

  extend type Mutation {
    addReview(
      cafeId: ID!
      userId: ID!
      rating: Int!
      reviewText: String!
    ): Review!
    updateReview(
      id: ID!
      rating: Int
      reviewText: String
    ): Review!
  }
`;
