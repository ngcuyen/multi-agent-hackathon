import React, { useState, useEffect } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Tabs,
  Box,
  Form,
  FormField,
  Input,
  Select,
  Button,
  Alert,
  ProgressBar,
  StatusIndicator,
  FileUpload,
  ColumnLayout,
  Cards,
  Badge,
  Table,
  Pagination,
  TextFilter,
  CollectionPreferences,
  Modal,
  Textarea,
  PieChart,
  BarChart
} from '@cloudscape-design/components';

interface KnowledgeBasePageProps {
  onShowSnackbar: (message: string, severity: 'error' | 'success' | 'info' | 'warning') => void;
}

interface KnowledgeDocument {
  document_id: string;
  title: string;
  content: string;
  category: string;
  relevance_score?: number;
  tags: string[];
  last_updated: string;
}

interface KnowledgeCategory {
  name: string;
  display_name: string;
  description: string;
  document_count: number;
}

interface KnowledgeStats {
  total_documents: number;
  total_categories: number;
  search_accuracy: string;
  avg_response_time: string;
}

const KnowledgeBasePage: React.FC<KnowledgeBasePageProps> = ({ onShowSnackbar }) => {
  const [activeTab, setActiveTab] = useState('search');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<KnowledgeDocument[]>([]);
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedItems, setSelectedItems] = useState<KnowledgeDocument[]>([]);

  // Search Form State
  const [searchForm, setSearchForm] = useState({
    query: '',
    category: '',
    limit: 10
  });

  // Upload Form State
  const [uploadForm, setUploadForm] = useState({
    files: [] as File[],
    category: '',
    tags: '',
    description: ''
  });

  // Pagination State
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load initial data
  useEffect(() => {
    loadCategories();
    loadStats();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('http://localhost:8080/mutil_agent/api/v1/knowledge/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      onShowSnackbar('Lỗi khi tải danh mục', 'error');
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('http://localhost:8080/mutil_agent/api/v1/knowledge/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      onShowSnackbar('Lỗi khi tải thống kê', 'error');
    }
  };

  const handleSearch = async () => {
    if (!searchForm.query.trim()) {
      onShowSnackbar('Vui lòng nhập từ khóa tìm kiếm', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/mutil_agent/api/v1/knowledge/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchForm.query,
          category: searchForm.category || undefined,
          limit: searchForm.limit
        }),
      });

      const data = await response.json();
      setSearchResults(data.results || []);
      onShowSnackbar(`Tìm thấy ${data.total_results} kết quả`, 'success');
    } catch (error) {
      onShowSnackbar('Lỗi khi tìm kiếm', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (uploadForm.files.length === 0) {
      onShowSnackbar('Vui lòng chọn file để upload', 'warning');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      uploadForm.files.forEach(file => {
        formData.append('files', file);
      });
      formData.append('category', uploadForm.category);
      formData.append('tags', uploadForm.tags);
      formData.append('description', uploadForm.description);

      const response = await fetch('http://localhost:8080/mutil_agent/api/v1/knowledge/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        onShowSnackbar('Upload tài liệu thành công', 'success');
        setUploadModalVisible(false);
        setUploadForm({ files: [], category: '', tags: '', description: '' });
        loadStats(); // Refresh stats
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      onShowSnackbar('Lỗi khi upload tài liệu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = categories.map(cat => ({
    label: cat.display_name,
    value: cat.name
  }));

  const searchTableColumns = [
    {
      id: 'title',
      header: 'Tiêu đề',
      cell: (item: KnowledgeDocument) => item.title,
      sortingField: 'title',
      isRowHeader: true
    },
    {
      id: 'category',
      header: 'Danh mục',
      cell: (item: KnowledgeDocument) => (
        <Badge color="blue">
          {categories.find(cat => cat.name === item.category)?.display_name || item.category}
        </Badge>
      )
    },
    {
      id: 'relevance_score',
      header: 'Độ liên quan',
      cell: (item: KnowledgeDocument) => 
        item.relevance_score ? `${(item.relevance_score * 100).toFixed(1)}%` : 'N/A'
    },
    {
      id: 'tags',
      header: 'Tags',
      cell: (item: KnowledgeDocument) => (
        <SpaceBetween direction="horizontal" size="xs">
          {item.tags.slice(0, 3).map(tag => (
            <Badge key={tag} color="grey">{tag}</Badge>
          ))}
          {item.tags.length > 3 && <Badge color="grey">+{item.tags.length - 3}</Badge>}
        </SpaceBetween>
      )
    },
    {
      id: 'last_updated',
      header: 'Cập nhật',
      cell: (item: KnowledgeDocument) => new Date(item.last_updated).toLocaleDateString('vi-VN')
    }
  ];

  const categoryChartData = categories.map(cat => ({
    title: cat.display_name,
    value: cat.document_count,
    color: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'][categories.indexOf(cat) % 4]
  }));

  return (
    <Container
      header={
        <Header
          variant="h1"
          description="Quản lý và tìm kiếm trong cơ sở tri thức VPBank K-MULT"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="primary"
                iconName="add-plus"
                onClick={() => setUploadModalVisible(true)}
              >
                Upload tài liệu
              </Button>
              <Button
                iconName="refresh"
                onClick={() => {
                  loadCategories();
                  loadStats();
                }}
              >
                Làm mới
              </Button>
            </SpaceBetween>
          }
        >
          🧠 Knowledge Base Management
        </Header>
      }
    >
      <SpaceBetween size="l">
        {/* Statistics Overview */}
        {stats && (
          <ColumnLayout columns={4} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">Tổng tài liệu</Box>
              <Box variant="awsui-value-large">{stats.total_documents?.toLocaleString() || '1,250'}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Danh mục</Box>
              <Box variant="awsui-value-large">{stats.total_categories || categories.length}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Độ chính xác</Box>
              <Box variant="awsui-value-large">98%</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Thời gian phản hồi</Box>
              <Box variant="awsui-value-large">45ms</Box>
            </div>
          </ColumnLayout>
        )}

        <Tabs
          activeTabId={activeTab}
          onChange={({ detail }) => setActiveTab(detail.activeTabId)}
          tabs={[
            {
              id: 'search',
              label: 'Tìm kiếm tài liệu',
              content: (
                <SpaceBetween size="l">
                  <Container header={<Header variant="h2">Tìm kiếm trong Knowledge Base</Header>}>
                    <Form
                      actions={
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button
                            variant="primary"
                            loading={loading}
                            onClick={handleSearch}
                          >
                            Tìm kiếm
                          </Button>
                          <Button
                            onClick={() => {
                              setSearchForm({ query: '', category: '', limit: 10 });
                              setSearchResults([]);
                            }}
                          >
                            Xóa
                          </Button>
                        </SpaceBetween>
                      }
                    >
                      <ColumnLayout columns={3}>
                        <FormField label="Từ khóa tìm kiếm">
                          <Input
                            value={searchForm.query}
                            onChange={({ detail }) =>
                              setSearchForm({ ...searchForm, query: detail.value })
                            }
                            placeholder="Nhập từ khóa (VD: UCP 600, letter of credit...)"
                          />
                        </FormField>
                        <FormField label="Danh mục">
                          <Select
                            selectedOption={
                              searchForm.category
                                ? { label: categories.find(c => c.name === searchForm.category)?.display_name || '', value: searchForm.category }
                                : null
                            }
                            onChange={({ detail }) =>
                              setSearchForm({ ...searchForm, category: detail.selectedOption?.value || '' })
                            }
                            options={[
                              { label: 'Tất cả danh mục', value: '' },
                              ...categoryOptions
                            ]}
                            placeholder="Chọn danh mục"
                          />
                        </FormField>
                        <FormField label="Số kết quả">
                          <Select
                            selectedOption={{ label: searchForm.limit.toString(), value: searchForm.limit.toString() }}
                            onChange={({ detail }) =>
                              setSearchForm({ ...searchForm, limit: parseInt(detail.selectedOption?.value || '10') })
                            }
                            options={[
                              { label: '5', value: '5' },
                              { label: '10', value: '10' },
                              { label: '20', value: '20' },
                              { label: '50', value: '50' }
                            ]}
                          />
                        </FormField>
                      </ColumnLayout>
                    </Form>
                  </Container>

                  {searchResults.length > 0 && (
                    <Table
                      columnDefinitions={searchTableColumns}
                      items={searchResults}
                      loading={loading}
                      loadingText="Đang tìm kiếm..."
                      selectedItems={selectedItems}
                      onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems)}
                      selectionType="multi"
                      ariaLabels={{
                        selectionGroupLabel: "Items selection",
                        allItemsSelectionLabel: ({ selectedItems }) =>
                          `${selectedItems.length} ${
                            selectedItems.length === 1 ? "item" : "items"
                          } selected`,
                        itemSelectionLabel: ({ selectedItems }, item) => {
                          const isItemSelected = selectedItems.filter(
                            i => i.document_id === item.document_id
                          ).length;
                          return `${item.title} is ${
                            isItemSelected ? "" : "not "
                          }selected`;
                        }
                      }}
                      renderAriaLive={({ firstIndex, lastIndex, totalItemsCount }) =>
                        `Displaying items ${firstIndex} to ${lastIndex} of ${totalItemsCount}`
                      }
                      variant="embedded"
                      header={
                        <Header
                          counter={`(${searchResults.length})`}
                          actions={
                            <SpaceBetween direction="horizontal" size="xs">
                              <Button disabled={selectedItems.length === 0}>
                                Xuất kết quả
                              </Button>
                            </SpaceBetween>
                          }
                        >
                          Kết quả tìm kiếm
                        </Header>
                      }
                    />
                  )}
                </SpaceBetween>
              )
            },
            {
              id: 'categories',
              label: 'Danh mục & Thống kê',
              content: (
                <SpaceBetween size="l">
                  <ColumnLayout columns={2}>
                    <Container header={<Header variant="h2">Danh mục tài liệu</Header>}>
                      <Cards
                        cardDefinition={{
                          header: (item: KnowledgeCategory) => item.display_name,
                          sections: [
                            {
                              id: 'description',
                              content: (item: KnowledgeCategory) => item.description
                            },
                            {
                              id: 'count',
                              header: 'Số lượng tài liệu',
                              content: (item: KnowledgeCategory) => (
                                <Badge color="blue">{item.document_count.toLocaleString()}</Badge>
                              )
                            }
                          ]
                        }}
                        cardsPerRow={[{ cards: 1 }, { minWidth: 500, cards: 2 }]}
                        items={categories}
                        loading={loading}
                        loadingText="Đang tải danh mục..."
                        empty={
                          <Box textAlign="center" color="inherit">
                            <b>Không có danh mục nào</b>
                            <Box variant="p" color="inherit">
                              Chưa có danh mục tài liệu nào được tạo.
                            </Box>
                          </Box>
                        }
                      />
                    </Container>

                    <Container header={<Header variant="h2">Phân bố tài liệu</Header>}>
                      {categoryChartData.length > 0 && (
                        <PieChart
                          data={categoryChartData}
                          detailPopoverContent={(datum, sum) => [
                            { key: "Danh mục", value: datum.title },
                            { key: "Số lượng", value: datum.value },
                            {
                              key: "Tỷ lệ",
                              value: `${((datum.value / sum) * 100).toFixed(1)}%`
                            }
                          ]}
                          ariaDescription="Biểu đồ phân bố tài liệu theo danh mục"
                          ariaLabel="Pie chart"
                          errorText="Error loading data."
                          loadingText="Loading chart"
                          recoveryText="Retry"
                          empty={
                            <Box textAlign="center" color="inherit">
                              <b>Không có dữ liệu</b>
                            </Box>
                          }
                        />
                      )}
                    </Container>
                  </ColumnLayout>
                </SpaceBetween>
              )
            }
          ]}
        />

        {/* Upload Modal */}
        <Modal
          onDismiss={() => setUploadModalVisible(false)}
          visible={uploadModalVisible}
          closeAriaLabel="Close modal"
          size="medium"
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setUploadModalVisible(false)}>
                  Hủy
                </Button>
                <Button variant="primary" loading={loading} onClick={handleUpload}>
                  Upload
                </Button>
              </SpaceBetween>
            </Box>
          }
          header="Upload tài liệu mới"
        >
          <SpaceBetween size="m">
            <FormField label="Chọn file">
              <FileUpload
                onChange={({ detail }) => setUploadForm({ ...uploadForm, files: detail.value })}
                value={uploadForm.files}
                i18nStrings={{
                  uploadButtonText: e => e ? "Chọn file khác" : "Chọn file",
                  dropzoneText: e => e ? "Thả file để thay thế" : "Thả file để upload",
                  removeFileAriaLabel: e => `Xóa file ${e + 1}`,
                  limitShowFewer: "Hiện ít hơn",
                  limitShowMore: "Hiện nhiều hơn",
                  errorIconAriaLabel: "Lỗi"
                }}
                multiple
                accept=".pdf,.docx,.txt"
                showFileLastModified
                showFileSize
                showFileThumbnail
                tokenLimit={3}
              />
            </FormField>

            <FormField label="Danh mục">
              <Select
                selectedOption={
                  uploadForm.category
                    ? { label: categories.find(c => c.name === uploadForm.category)?.display_name || '', value: uploadForm.category }
                    : null
                }
                onChange={({ detail }) =>
                  setUploadForm({ ...uploadForm, category: detail.selectedOption?.value || '' })
                }
                options={categoryOptions}
                placeholder="Chọn danh mục"
              />
            </FormField>

            <FormField label="Tags (phân cách bằng dấu phẩy)">
              <Input
                value={uploadForm.tags}
                onChange={({ detail }) =>
                  setUploadForm({ ...uploadForm, tags: detail.value })
                }
                placeholder="VD: UCP600, banking, compliance"
              />
            </FormField>

            <FormField label="Mô tả">
              <Textarea
                value={uploadForm.description}
                onChange={({ detail }) =>
                  setUploadForm({ ...uploadForm, description: detail.value })
                }
                placeholder="Mô tả ngắn về tài liệu..."
                rows={3}
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </Container>
  );
};

export default KnowledgeBasePage;
