# 配额管理器（内存实现）
class QuotaManager:
    def __init__(self, limit: int = 100000):
        self.limit = limit
        self.used = 0

    def check_quota(self, amount: int) -> bool:
        return self.used + amount <= self.limit

    def use(self, amount: int):
        self.used += amount

    @property
    def remaining(self) -> int:
        return max(0, self.limit - self.used)

    def reset(self):
        self.used = 0

quota_manager = QuotaManager()
