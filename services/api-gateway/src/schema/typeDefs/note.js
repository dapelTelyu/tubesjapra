export const noteTypeDefs = `#graphql
  type PersonalNote {
    id: ID!
    userId: ID!
    cafeId: ID!
    noteText: String!
    createdAt: String
    updatedAt: String
    cafe: Cafe
  }

  extend type Mutation {
    addPersonalNote(
      userId: ID!
      cafeId: ID!
      noteText: String!
    ): PersonalNote!
    updatePersonalNote(
      id: ID!
      noteText: String!
    ): PersonalNote!
  }
`;
