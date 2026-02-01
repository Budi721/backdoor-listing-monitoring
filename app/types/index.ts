export type EventType = 'RIGHTS_ISSUE' | 'MTO' | 'BACKDOOR_LISTING'

export interface IDXAnnouncementItem {
  Id: string
  Title: string
  PublishDate: string
  Code: string
  Attachments: Array<{
    FullSavePath: string
    IsAttachment: number
  }>
}

export interface IDXApiResponse {
  Items: IDXAnnouncementItem[]
  ItemCount: number
  PageCount: number
}

export interface ScrapedAnnouncement {
  title: string
  url: string
  source: string
  content: string | null
  published_at: string
  event_type: EventType
  ticker?: string
}

export interface ScrapingStats {
  api_calls: number
  total_fetched: number
  saved: number
  duplicates: number
  rights_issue: number
  mto: number
  backdoor: number
}

