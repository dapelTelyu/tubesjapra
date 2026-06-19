export const cafeTypeDefs = `#graphql
  type Cafe {
    id: ID!
    name: String!
    description: String
    address: String!
    photo: String
    rating: Float
    publishStatus: PublishStatus!
    createdAt: String
    updatedAt: String
    reviews: [Review!]
    personalNotes(userId: ID!): [PersonalNote!]
  }

  extend type Query {
    getCafes: [Cafe!]!
    getCafeById(id: ID!): Cafe
    getPendingCafes: [Cafe!]!
  }

  extend type Mutation {
    createCafe(
      name: String!
      description: String
      address: String!
      photo: String
      rating: Float
      review: String
    ): Cafe!
    updateCafe(
      id: ID!
      name: String
      description: String
      address: String
      photo: String
      rating: Float
      review: String
    ): Cafe!
    deleteCafe(id: ID!): Boolean!
    updateCafePublishStatus(id: ID!, publishStatus: PublishStatus!): Cafe!
  }
`;
