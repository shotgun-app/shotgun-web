import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'

import TripSearch from '../TripSearch.vue'
import { useTripsStore } from '@/stores/trips'

describe('TripSearch.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders with origin and destination city dropdowns disabled initially', () => {
    const wrapper = mount(TripSearch)

    const selects = wrapper.findAll('select')
    expect(selects.length).toBe(4) // fromCountry, fromCity, toCountry, toCity

    const fromCountrySelect = selects[0]!
    const fromCitySelect = selects[1]!

    expect(fromCountrySelect.element.value).toBe('')
    expect(fromCitySelect.attributes('disabled')).toBeDefined()
  })

  it('enables city dropdown and populates cities when country is selected', async () => {
    const wrapper = mount(TripSearch)
    const selects = wrapper.findAll('select')

    const fromCountrySelect = selects[0]!
    const fromCitySelect = selects[1]!

    await fromCountrySelect.setValue('Sweden')

    expect(fromCitySelect.attributes('disabled')).toBeUndefined()
    const options = fromCitySelect.findAll('option')
    const optionTexts = options.map((opt) => opt.text())
    expect(optionTexts).toContain('Gothenburg')
    expect(optionTexts).toContain('Stockholm')
  })

  it('resets city when country changes', async () => {
    const wrapper = mount(TripSearch)
    const selects = wrapper.findAll('select')

    const fromCountrySelect = selects[0]!
    const fromCitySelect = selects[1]!

    await fromCountrySelect.setValue('Sweden')
    await fromCitySelect.setValue('Gothenburg')
    expect(fromCitySelect.element.value).toBe('Gothenburg')

    // Change country to Germany
    await fromCountrySelect.setValue('Germany')
    expect(fromCitySelect.element.value).toBe('')
  })

  it('fills demo route and triggers search on submit', async () => {
    const wrapper = mount(TripSearch)
    const tripsStore = useTripsStore()

    // Click Gothenburg -> Stockholm demo button
    const demoButton = wrapper.findAll('button[type="button"]')[0]!
    await demoButton.trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    const selects = wrapper.findAll('select')
    expect(selects[0]!.element.value).toBe('Sweden')
    expect(selects[1]!.element.value).toBe('Gothenburg')
    expect(selects[2]!.element.value).toBe('Sweden')
    expect(selects[3]!.element.value).toBe('Stockholm')

    await wrapper.find('form').trigger('submit')
    await new Promise((resolve) => setTimeout(resolve, 450))

    expect(tripsStore.hasSearched).toBe(true)
    expect(tripsStore.results.length).toBeGreaterThan(0)
  })
})
