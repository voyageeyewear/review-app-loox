import { json } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useNavigation } from "@remix-run/react";
import {
  Page,
  Card,
  DataTable,
  Button,
  Modal,
  FormLayout,
  TextField,
  Select,
  Banner,
  Badge,
  ButtonGroup,
  Toast,
  Frame
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { prisma } from "~/utils/db.server";
import { authenticate } from "~/shopify.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  try {
    // Fetch all product groups for this shop
    const productGroups = await prisma.productGroup.findMany({
      where: {
        shop: session.shop
      },
      include: {
        _count: {
          select: { reviews: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return json({
      success: true,
      productGroups: productGroups.map(group => ({
        ...group,
        productIds: JSON.parse(group.productIds || '[]'),
        reviewCount: group._count.reviews
      }))
    });
  } catch (error) {
    console.error("Error fetching product groups:", error);
    return json({
      success: false,
      error: "Failed to fetch product groups"
    });
  }
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");

  try {
    if (action === "create") {
      const name = formData.get("name");
      const description = formData.get("description");
      const productIds = formData.get("productIds");

      const productGroup = await prisma.productGroup.create({
        data: {
          shop: session.shop,
          name,
          description: description || null,
          productIds: productIds || '[]'
        }
      });

      return json({
        success: true,
        message: "Product group created successfully!",
        productGroup
      });
    }

    if (action === "delete") {
      const id = parseInt(formData.get("id"));
      
      // First, remove the group association from all reviews
      await prisma.review.updateMany({
        where: {
          productGroupId: id
        },
        data: {
          productGroupId: null
        }
      });

      // Then delete the product group
      await prisma.productGroup.delete({
        where: { id }
      });

      return json({
        success: true,
        message: "Product group deleted successfully!"
      });
    }

    if (action === "update") {
      const id = parseInt(formData.get("id"));
      const name = formData.get("name");
      const description = formData.get("description");
      const productIds = formData.get("productIds");

      await prisma.productGroup.update({
        where: { id },
        data: {
          name,
          description: description || null,
          productIds: productIds || '[]'
        }
      });

      return json({
        success: true,
        message: "Product group updated successfully!"
      });
    }

  } catch (error) {
    console.error("Error in product groups action:", error);
    return json({
      success: false,
      error: error.message
    });
  }
};

export default function ProductGroups() {
  const data = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  
  const [modalActive, setModalActive] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    productIds: ''
  });

  const isSubmitting = navigation.state === "submitting";

  const handleModalClose = useCallback(() => {
    setModalActive(false);
    setEditingGroup(null);
    setFormData({ name: '', description: '', productIds: '' });
  }, []);

  const handleEdit = useCallback((group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      productIds: JSON.stringify(group.productIds)
    });
    setModalActive(true);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingGroup(null);
    setFormData({ name: '', description: '', productIds: '' });
    setModalActive(true);
  }, []);

  const rows = data.productGroups?.map((group) => [
    group.name,
    group.description || '—',
    <Badge key="count">{group.productIds.length} products</Badge>,
    <Badge key="reviews" status="info">{group.reviewCount} reviews</Badge>,
    new Date(group.createdAt).toLocaleDateString(),
    <ButtonGroup key="actions">
      <Button size="slim" onClick={() => handleEdit(group)}>
        Edit
      </Button>
      <Form method="post" style={{ display: 'inline' }}>
        <input type="hidden" name="action" value="delete" />
        <input type="hidden" name="id" value={group.id} />
        <Button size="slim" destructive submit>
          Delete
        </Button>
      </Form>
    </ButtonGroup>
  ]) || [];

  return (
    <Page
      title="Product Groups"
      subtitle="Group related products to share reviews across variants"
      primaryAction={{
        content: "Create Group",
        onAction: handleCreate
      }}
    >
      {actionData?.success === false && (
        <Banner status="critical" title="Error">
          {actionData.error}
        </Banner>
      )}

      {actionData?.success && (
        <Banner status="success" title="Success">
          {actionData.message}
        </Banner>
      )}

      <Card>
        <DataTable
          columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
          headings={['Group Name', 'Description', 'Products', 'Reviews', 'Created', 'Actions']}
          rows={rows}
          footerContent={`${data.productGroups?.length || 0} product groups`}
        />
      </Card>

      <Modal
        open={modalActive}
        onClose={handleModalClose}
        title={editingGroup ? "Edit Product Group" : "Create Product Group"}
        primaryAction={{
          content: editingGroup ? "Update Group" : "Create Group",
          onAction: () => {
            // Form submission is handled by the Form component
          },
          loading: isSubmitting
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleModalClose
          }
        ]}
      >
        <Modal.Section>
          <Form method="post">
            <FormLayout>
              <input 
                type="hidden" 
                name="action" 
                value={editingGroup ? "update" : "create"} 
              />
              {editingGroup && (
                <input type="hidden" name="id" value={editingGroup.id} />
              )}
              
              <TextField
                label="Group Name"
                name="name"
                value={formData.name}
                onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
                placeholder="e.g., iPhone 15 Collection"
                helpText="Give your product group a descriptive name"
                autoComplete="off"
              />

              <TextField
                label="Description (Optional)"
                name="description"
                value={formData.description}
                onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                placeholder="e.g., All iPhone 15 variants and colors"
                multiline={3}
                autoComplete="off"
              />

              <TextField
                label="Product IDs"
                name="productIds"
                value={formData.productIds}
                onChange={(value) => setFormData(prev => ({ ...prev, productIds: value }))}
                placeholder='["123456789", "987654321", "555666777"]'
                helpText="Enter product IDs as a JSON array. You can find product IDs in your Shopify admin."
                multiline={2}
                autoComplete="off"
              />
            </FormLayout>
          </Form>
        </Modal.Section>
      </Modal>
    </Page>
  );
} 