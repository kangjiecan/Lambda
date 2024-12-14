const { PrismaClient } = require('@prisma/client');
const { handler } = require('./src/handlers/mediaHandler');

const prisma = new PrismaClient();

describe('Handler Tests with Real Database', () => {
  beforeAll(async () => {
    // Optional: Clean up the table or insert initial data
    await prisma.media.deleteMany(); // Clear the media table
  });

  afterAll(async () => {
    // Insert a record into the media table at the end of the tests
    await prisma.media.create({
      data: {
        fileName: 'final_test_record.jpg',
        fileType: 'image/jpeg',
        userId: 999, // Replace with a user ID for the test
      },
    });
    await prisma.$disconnect(); // Disconnect Prisma after all tests
  });

  test('should create media successfully (POST)', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({
        fileName: 'example.jpg',
        fileType: 'image/jpeg',
        userId: 1,
      }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(201);

    const media = await prisma.media.findMany(); // Fetch the data from the database
    expect(media).toHaveLength(1); // Ensure a record was created
    expect(media[0].fileName).toBe('example.jpg');
    expect(media[0].fileType).toBe('image/jpeg');
    expect(media[0].userId).toBe(1);
  });

  test('should retrieve all media (GET)', async () => {
    const event = { httpMethod: 'GET' };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);

    const media = JSON.parse(response.body);
    expect(media).toHaveLength(1); // Ensure the record exists
    expect(media[0].fileName).toBe('example.jpg');
  });

  test('should retrieve media by ID (GET)', async () => {
    const existingMedia = await prisma.media.findFirst();
    expect(existingMedia).not.toBeNull(); // Ensure media exists

    const event = {
      httpMethod: 'GET',
      pathParameters: { id: existingMedia.id.toString() },
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);

    const media = JSON.parse(response.body);
    expect(media.id).toBe(existingMedia.id);
    expect(media.fileName).toBe(existingMedia.fileName);
  });

  test('should update media successfully (PUT)', async () => {
    const existingMedia = await prisma.media.findFirst();
    expect(existingMedia).not.toBeNull(); // Ensure media exists

    const event = {
      httpMethod: 'PUT',
      pathParameters: { id: existingMedia.id.toString() },
      body: JSON.stringify({
        fileName: 'updated.jpg',
        fileType: 'image/png',
      }),
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(200);

    const updatedMedia = await prisma.media.findUnique({
      where: { id: existingMedia.id },
    });

    expect(updatedMedia.fileName).toBe('updated.jpg');
    expect(updatedMedia.fileType).toBe('image/png');
  });

  test('should delete media successfully (DELETE)', async () => {
    const existingMedia = await prisma.media.findFirst();
    expect(existingMedia).not.toBeNull(); // Ensure media exists

    const event = {
      httpMethod: 'DELETE',
      pathParameters: { id: existingMedia.id.toString() },
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(200);

    const deletedMedia = await prisma.media.findUnique({
      where: { id: existingMedia.id },
    });

    expect(deletedMedia).toBeNull(); // Verify deletion
  });
});