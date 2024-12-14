const { PrismaClient } = require('@prisma/client');

// Reuse PrismaClient across Lambda invocations
let prisma;

if (!prisma) {
  prisma = new PrismaClient();
}

const handler = async (event) => {
  try {
    const { httpMethod, pathParameters, queryStringParameters, body } = event;

    switch (httpMethod) {
      case 'POST':
        return await createMedia(body);

      case 'GET':
        if (pathParameters && pathParameters.id) {
          return await getMediaById(pathParameters.id);
        } else if (queryStringParameters && queryStringParameters.userId) {
          return await getMediaByUserId(queryStringParameters.userId);
        } else {
          return await getAllMedia();
        }

      case 'PUT':
        if (pathParameters && pathParameters.id) {
          return await updateMedia(pathParameters.id, body);
        } else {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Media ID is required for update' }),
          };
        }

      case 'DELETE':
        if (pathParameters && pathParameters.id) {
          return await deleteMedia(pathParameters.id);
        } else {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Media ID is required for deletion' }),
          };
        }

      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
  } catch (error) {
    console.error('Error handling request:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', message: error.message }),
    };
  }
};

// Individual CRUD operations
const createMedia = async (body) => {
  if (!body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Request body is required' }),
    };
  }

  let input;
  try {
    input = JSON.parse(body);
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON in request body' }),
    };
  }

  if (!input.fileName || !input.userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'File name and user ID are required' }),
    };
  }

  const media = await prisma.media.create({
    data: {
      fileName: input.fileName,
      fileType: input.fileType || null,
      userId: input.userId,
    },
  });

  return {
    statusCode: 201,
    body: JSON.stringify(media),
  };
};

const getAllMedia = async () => {
  const media = await prisma.media.findMany();
  return {
    statusCode: 200,
    body: JSON.stringify(media),
  };
};

const getMediaById = async (id) => {
  const media = await prisma.media.findUnique({
    where: { id: parseInt(id, 10) },
  });

  if (!media) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Media not found' }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(media),
  };
};

const getMediaByUserId = async (userId) => {
  const media = await prisma.media.findMany({
    where: { userId: parseInt(userId, 10) },
  });

  return {
    statusCode: 200,
    body: JSON.stringify(media),
  };
};

const updateMedia = async (id, body) => {
  if (!body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Request body is required' }),
    };
  }

  let input;
  try {
    input = JSON.parse(body);
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON in request body' }),
    };
  }

  const updatedMedia = await prisma.media.update({
    where: { id: parseInt(id, 10) },
    data: {
      fileName: input.fileName,
      fileType: input.fileType,
    },
  });

  return {
    statusCode: 200,
    body: JSON.stringify(updatedMedia),
  };
};

const deleteMedia = async (id) => {
  try {
    await prisma.media.delete({
      where: { id: parseInt(id, 10) },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Media deleted successfully' }),
    };
  } catch (error) {
    console.error('Error deleting media:', error);
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Media not found' }),
    };
  }
};

module.exports = { handler };