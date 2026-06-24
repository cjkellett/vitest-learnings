<script setup>
import { ref, computed } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'

const users = ref([
  { id: 1,  name: 'Alice Nguyen',    role: 'Engineer',        status: 'Active',   joined: '2021-03-15' },
  { id: 2,  name: 'Bob Martinez',    role: 'Designer',        status: 'Active',   joined: '2020-07-22' },
  { id: 3,  name: 'Carol Smith',     role: 'Product Manager', status: 'Inactive', joined: '2019-11-05' },
  { id: 4,  name: 'David Lee',       role: 'Engineer',        status: 'Active',   joined: '2022-01-30' },
  { id: 5,  name: 'Eva Kowalski',    role: 'QA Engineer',     status: 'Active',   joined: '2021-09-14' },
  { id: 6,  name: 'Frank O\'Brien',  role: 'DevOps',          status: 'Active',   joined: '2020-04-18' },
  { id: 7,  name: 'Grace Chen',      role: 'Engineer',        status: 'On Leave', joined: '2023-02-01' },
  { id: 8,  name: 'Henry Okafor',    role: 'Designer',        status: 'Active',   joined: '2022-06-10' },
  { id: 9,  name: 'Isla Patel',      role: 'Engineer',        status: 'Inactive', joined: '2018-12-20' },
  { id: 10, name: 'James Tanaka',    role: 'Product Manager', status: 'Active',   joined: '2023-05-07' },
])

const nameFilter = ref('')

const filteredUsers = computed(() =>
  users.value.filter(u =>
    u.name.toLowerCase().includes(nameFilter.value.toLowerCase())
  )
)
</script>

<template>
  <div class="flex flex-col gap-3">
    <InputText v-model="nameFilter" placeholder="Search by name..." />
    <DataTable :value="filteredUsers" striped-rows>
      <Column field="id"     header="#"       style="width: 4rem" />
      <Column field="name"   header="Name" />
      <Column field="role"   header="Role" />
      <Column field="status" header="Status" />
      <Column field="joined" header="Joined" />
    </DataTable>
  </div>
</template>
